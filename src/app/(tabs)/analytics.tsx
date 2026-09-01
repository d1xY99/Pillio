import { useFocusEffect } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { GlassCard } from '@/components/glass-card';
import { HeroBanner } from '@/components/hero-banner';
import { MenuButton } from '@/components/menu-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { ART } from '@/constants/art';
import { formatKg } from '@/constants/gym';
import { Radius, Spacing } from '@/constants/theme';
import { subscribeDb } from '@/db/events';
import {
  formatDeltaPct,
  formatPct,
  formatWeekRange,
  recapHeadline,
  startOfLocalWeek,
  weekRecap,
  type DayPulse,
  type NamedRate,
  type WeekRecap,
} from '@/domain/analytics';
import { addLocalDays } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';
import { pullFromCloud } from '@/sync/cloud';

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const [weekStart, setWeekStart] = useState(() => startOfLocalWeek());

  useFocusEffect(
    useCallback(() => {
      void pullFromCloud();
      setTick((value) => value + 1);
    }, []),
  );

  useLayoutEffect(
    () =>
      subscribeDb(() => {
        setTick((value) => value + 1);
      }),
    [],
  );

  const recap = useMemo(() => weekRecap(weekStart), [weekStart, tick]);
  const currentWeek = startOfLocalWeek();
  const canNext = weekStart < currentWeek;
  const empty =
    recap.stackDue === 0 && recap.habitDue === 0 && recap.workouts === 0 && recap.weightDelta == null;

  return (
    <Screen>
      <ScreenHeader title="Analytics" subtitle="Weekly recap" right={<MenuButton />} />

      <HeroBanner
        compact
        kicker={recap.isCurrent ? 'THIS WEEK' : 'PAST WEEK'}
        title={recapHeadline(recap)}
        source={ART.progress}
      />

      <View style={styles.weekNav}>
        <Pressable
          onPress={() => setWeekStart((value) => addLocalDays(value, -7))}
          hitSlop={10}
          accessibilityLabel="Previous week">
          <UiIcon name="arrow.left" color={theme.text} size={16} />
        </Pressable>
        <View style={styles.weekCopy}>
          <ThemedText type="captionBold">{recap.isCurrent ? 'This week' : 'Past week'}</ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            {formatWeekRange(weekStart)}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => canNext && setWeekStart((value) => addLocalDays(value, 7))}
          hitSlop={10}
          disabled={!canNext}
          accessibilityLabel="Next week"
          style={{ opacity: canNext ? 1 : 0.28 }}>
          <UiIcon name="chevron.right" color={theme.text} size={18} />
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <StatTile label="Stack" value={formatPct(recap.stackPct)} hint={stackHint(recap)} />
          <StatTile label="Habits" value={formatPct(recap.habitPct)} hint={habitHint(recap)} />
        </View>
        <View style={styles.statRow}>
          <StatTile
            label="Train"
            value={String(recap.workouts)}
            hint={recap.workouts === 1 ? 'session' : 'sessions'}
          />
          <StatTile
            label="Weight"
            value={recap.weightDelta == null ? '—' : formatDeltaKg(recap.weightDelta)}
            hint={recap.weightEnd != null ? formatKg(recap.weightEnd) : 'no weigh-in'}
          />
        </View>
      </View>

      <WeekStrip days={recap.days} />

      {empty ? (
        <FadeIn delay={80}>
          <EmptyState
            icon="chart.line.uptrend.xyaxis"
            title="No protocol data this week"
            body="Check off Today, Habits, and Train. Weight on Body. This recap fills in from what you already log."
          />
        </FadeIn>
      ) : (
        <>
          <Section
            kicker="Stack"
            value={formatPct(recap.stackPct)}
            hint={
              recap.stackDue
                ? `${recap.stackTaken}/${recap.stackDue} doses · ${recap.stackStreak}-day streak`
                : 'Nothing due'
            }
            delta={formatDeltaPct(recap.stackPct, recap.vsLast.stackPct)}>
            {recap.supplements.length ? (
              recap.supplements.map((row) => <RateRow key={row.id} row={row} />)
            ) : (
              <ThemedText type="callout" themeColor="textTertiary">
                No doses in this window.
              </ThemedText>
            )}
          </Section>

          <Section
            kicker="Habits"
            value={formatPct(recap.habitPct)}
            hint={
              recap.habitDue
                ? `${recap.habitDone}/${recap.habitDue} checks · ${recap.habitStreak}-day streak`
                : 'No rituals due'
            }
            delta={formatDeltaPct(recap.habitPct, recap.vsLast.habitPct)}>
            {recap.habits.length ? (
              recap.habits.map((row) => <RateRow key={row.id} row={row} />)
            ) : (
              <ThemedText type="callout" themeColor="textTertiary">
                No habits in this window.
              </ThemedText>
            )}
          </Section>

          <Section
            kicker="Train"
            value={String(recap.workouts)}
            hint={trainHint(recap)}
            delta={trainDelta(recap)}>
            <View style={styles.split}>
              <MiniStat label="Sets" value={String(recap.sets)} />
              <MiniStat label="Volume" value={recap.volumeKg ? `${Math.round(recap.volumeKg)} kg` : '—'} />
              <MiniStat label="Last week" value={String(recap.vsLast.workouts)} />
            </View>
          </Section>

          <Section
            kicker="Body"
            value={recap.weightEnd != null ? formatKg(recap.weightEnd) : '—'}
            hint={bodyHint(recap)}>
            <View style={styles.split}>
              <MiniStat
                label="Week Δ"
                value={recap.weightDelta == null ? '—' : formatDeltaKg(recap.weightDelta)}
              />
              <MiniStat
                label="Start"
                value={recap.weightStart != null ? formatKg(recap.weightStart) : '—'}
              />
              <MiniStat label="Photos" value={String(recap.photos)} />
            </View>
          </Section>
        </>
      )}
    </Screen>
  );
}

function stackHint(recap: WeekRecap) {
  if (recap.stackDue === 0) return 'nothing due';
  return `${recap.stackTaken}/${recap.stackDue}`;
}

function habitHint(recap: WeekRecap) {
  if (recap.habitDue === 0) return 'nothing due';
  return `${recap.habitDone}/${recap.habitDue}`;
}

function trainHint(recap: WeekRecap) {
  if (recap.workouts === 0) return 'No finished sessions';
  const session = recap.workouts === 1 ? 'session' : 'sessions';
  return `${recap.sets} sets · ${session}`;
}

function trainDelta(recap: WeekRecap) {
  const delta = recap.workouts - recap.vsLast.workouts;
  if (delta === 0) return recap.vsLast.workouts ? 'same as last week' : null;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} vs last week`;
}

function bodyHint(recap: WeekRecap) {
  if (recap.weightDelta == null) return recap.photos ? `${recap.photos} photos` : 'No weigh-in this week';
  return recap.photos ? `${recap.photos} photos` : 'From last logged weight';
}

function formatDeltaKg(delta: number) {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${formatKg(delta)}`;
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ThemedText type="captionBold" themeColor="textTertiary" style={styles.tileKicker}>
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText type="title">{value}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
        {hint}
      </ThemedText>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <ThemedText type="caption" themeColor="textTertiary">
        {label}
      </ThemedText>
      <ThemedText type="headline">{value}</ThemedText>
    </View>
  );
}

function Section({
  kicker,
  value,
  hint,
  delta,
  children,
}: {
  kicker: string;
  value: string;
  hint: string;
  delta?: string | null;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
          {kicker.toUpperCase()}
        </ThemedText>
        <ThemedText type="headline">{value}</ThemedText>
      </View>
      <ThemedText type="callout" themeColor="textSecondary">
        {hint}
        {delta ? ` · ${delta}` : ''}
      </ThemedText>
      <GlassCard style={styles.sectionCard}>{children}</GlassCard>
    </View>
  );
}

function RateRow({ row }: { row: NamedRate }) {
  const theme = useTheme();
  const fill = row.pct >= 80 ? theme.accent : row.pct >= 50 ? theme.warning : theme.danger;
  return (
    <View style={styles.rate}>
      <View style={styles.rateCopy}>
        <ThemedText type="callout" numberOfLines={1} style={styles.rateName}>
          {row.name}
        </ThemedText>
        <ThemedText type="caption" themeColor="textTertiary">
          {row.done}/{row.due}
        </ThemedText>
        <ThemedText type="captionBold">{row.pct}%</ThemedText>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.barFill, { width: `${Math.max(4, row.pct)}%`, backgroundColor: fill }]} />
      </View>
    </View>
  );
}

function WeekStrip({ days }: { days: DayPulse[] }) {
  const theme = useTheme();
  return (
    <GlassCard style={styles.strip}>
      <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
        DAYS
      </ThemedText>
      <View style={styles.stripRow}>
        {days.map((day) => {
          const stack =
            day.isFuture || day.stackDue === 0
              ? theme.border
              : day.stackTaken >= day.stackDue
                ? theme.accent
                : day.stackTaken > 0
                  ? theme.warning
                  : theme.danger;
          const habit =
            day.isFuture || day.habitDue === 0
              ? theme.border
              : day.habitDone >= day.habitDue
                ? theme.accent
                : day.habitDone > 0
                  ? theme.warning
                  : theme.danger;
          return (
            <View key={day.dayStart} style={styles.stripDay}>
              <ThemedText
                type="captionBold"
                themeColor={day.isToday ? 'accent' : 'textTertiary'}
                style={styles.stripLabel}>
                {day.label}
              </ThemedText>
              <View style={[styles.pip, { backgroundColor: stack }]} />
              <View style={[styles.pip, { backgroundColor: habit }]} />
              <View
                style={[
                  styles.pip,
                  { backgroundColor: day.trained ? theme.accent : theme.border },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <ThemedText type="caption" themeColor="textTertiary">
          Top to bottom: Stack · Habits · Train
        </ThemedText>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    paddingHorizontal: 4,
  },
  weekCopy: {
    alignItems: 'center',
    gap: 2,
  },
  stats: {
    gap: 10,
    marginBottom: Spacing.three,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  tileKicker: {
    letterSpacing: 1.2,
    fontSize: 10,
  },
  strip: {
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  stripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stripDay: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stripLabel: {
    fontSize: 11,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legend: {
    paddingTop: 4,
  },
  section: {
    marginBottom: Spacing.four,
    gap: 6,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionKicker: {
    letterSpacing: 1.6,
    fontSize: 11,
  },
  sectionCard: {
    marginTop: 8,
    gap: 12,
  },
  split: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  mini: {
    flex: 1,
    gap: 4,
  },
  rate: {
    gap: 6,
  },
  rateCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateName: {
    flex: 1,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
});
