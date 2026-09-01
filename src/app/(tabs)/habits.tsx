import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyState } from '@/components/empty-state';
import { FadeIn as FadeBlock } from '@/components/fade-in';
import { HabitLaneCard } from '@/components/habit-lane-card';
import { HabitRow } from '@/components/habit-row';
import { Kicker } from '@/components/kicker';
import { MenuButton } from '@/components/menu-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { ART } from '@/constants/art';
import { HABIT_CATEGORIES, habitCategoryArt } from '@/constants/habits';
import { Radius, Spacing } from '@/constants/theme';
import { subscribeDb } from '@/db/events';
import { listHabitLogsOnDay, listHabits } from '@/db/queries/habits';
import {
  ensureHabitLogs,
  isHabitDueOnDay,
  overallHabitStreak,
  toggleTodayHabit,
  type TodayHabit,
} from '@/domain/habits';
import { endOfLocalDay, startOfLocalDay } from '@/domain/time';
import { useCloudSlice } from '@/hooks/use-cloud-slice';
import { useTheme } from '@/hooks/use-theme';

const LANE_ROWS = [HABIT_CATEGORIES.slice(0, 3), HABIT_CATEGORIES.slice(3, 6)] as const;

export default function HabitsScreen() {
  useCloudSlice('habits');
  const router = useRouter();
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      try {
        ensureHabitLogs(1);
      } catch {
        // list still reads whatever is already stored
      } finally {
        setTick((value) => value + 1);
      }
    }, []),
  );

  useLayoutEffect(
    () =>
      subscribeDb(() => {
        setTick((value) => value + 1);
      }),
    [],
  );

  const today = useMemo(() => buildTodayHabits(), [tick]);
  const filtered = filter === 'all' ? today : today.filter((row) => row.habit.category === filter);
  const archivedOff = listHabits(false);
  const done = today.filter((row) => row.complete).length;
  const total = today.length;
  const streak = useMemo(() => overallHabitStreak(), [tick]);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of today) map[row.habit.category] = (map[row.habit.category] ?? 0) + 1;
    return map;
  }, [today]);
  const remaining = Math.max(total - done, 0);
  const heroTitle =
    total === 0 ? 'Build the day' : done === total ? 'All checked' : `${remaining} still open`;
  const listLabel = filter === 'all' ? 'Today' : (HABIT_CATEGORIES.find((row) => row.id === filter)?.label ?? 'Today');

  return (
    <Screen>
      <ScreenHeader
        title="Habits"
        subtitle="Daily actions"
        right={
          <View style={styles.headerActions}>
            <MenuButton />
            <Pressable
              onPress={() => router.push('/habit/form')}
              style={[styles.add, { backgroundColor: theme.accent }]}
              accessibilityLabel="Add habit">
              <UiIcon name="plus" color="#06110D" size={14} />
            </Pressable>
          </View>
        }
      />

      <Animated.View entering={FadeIn.duration(800)} style={styles.hero}>
        <Image source={ART.habitHero} style={styles.heroImage} contentFit="cover" />
        <LinearGradient colors={['rgba(6,7,8,0.18)', 'rgba(6,7,8,0.84)']} style={StyleSheet.absoluteFill} />
        <View style={styles.heroEdge} />
        <View style={styles.heroCopy}>
          <Kicker label="RITUAL" />
          <ThemedText type="title" style={styles.heroTitle} numberOfLines={1}>
            {heroTitle}
          </ThemedText>
          <View style={styles.heroMeta}>
            <HeroStat value={done} label="done" />
            <View style={styles.heroRule} />
            <HeroStat value={total} label="due" />
            <View style={styles.heroRule} />
            <HeroStat value={streak} label="streak" />
          </View>
        </View>
      </Animated.View>

      <View style={styles.sectionHead}>
        <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
          LANES
        </ThemedText>
        <Pressable onPress={() => setFilter('all')} hitSlop={8} accessibilityLabel="Show all habits">
          <ThemedText type="captionBold" themeColor={filter === 'all' ? 'accent' : 'textSecondary'}>
            All
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.lanes}>
        {LANE_ROWS.map((row, rowIndex) => (
          <View key={row.map((item) => item.id).join('-')} style={styles.laneRow}>
            {row.map((cat, index) => (
              <HabitLaneCard
                key={cat.id}
                label={cat.label}
                meta={`${counts[cat.id] ?? 0}`}
                source={habitCategoryArt(cat.id)}
                selected={filter === cat.id}
                delay={40 + (rowIndex * 3 + index) * 40}
                onPress={() => setFilter((current) => (current === cat.id ? 'all' : cat.id))}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.sectionHead}>
        <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
          {listLabel.toUpperCase()}
        </ThemedText>
        <ThemedText type="caption" themeColor="textTertiary">
          {filtered.length}
        </ThemedText>
      </View>

      {filtered.length === 0 ? (
        <FadeBlock delay={80}>
          <EmptyState
            icon="checkmark.circle"
            title={archivedOff.length ? 'Nothing in this lane' : 'No habits yet'}
            body={
              archivedOff.length
                ? 'Try another category, or add a ritual for today.'
                : 'Pick a category, give it a name, check it off like Today.'
            }
          />
        </FadeBlock>
      ) : (
        <View style={styles.list}>
          {filtered.map((item, index) => (
            <HabitRow
              key={item.habit.id}
              item={item}
              index={index}
              onPress={() => router.push({ pathname: '/habit/[id]', params: { id: item.habit.id } })}
              onToggle={() => {
                toggleTodayHabit(item);
                setTick((value) => value + 1);
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function buildTodayHabits(): TodayHabit[] {
  const start = startOfLocalDay();
  const logs = (() => {
    try {
      return listHabitLogsOnDay(start, endOfLocalDay());
    } catch {
      return [];
    }
  })();
  return listHabits(false)
    .filter((habit) => isHabitDueOnDay(habit, start))
    .map((habit) => {
      const rows = logs
        .filter((log) => log.habitId === habit.id)
        .sort((a, b) => a.occurrence - b.occurrence);
      const done = rows.filter((log) => log.takenAt).length;
      const total = Math.max(rows.length, habit.timesPerDay);
      return { habit, logs: rows, done, total, complete: done >= total && total > 0 };
    })
    .sort((a, b) => Number(a.complete) - Number(b.complete) || a.habit.name.localeCompare(b.habit.name));
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.heroStat}>
      <ThemedText type="headline" style={styles.heroStatValue}>
        {value}
      </ThemedText>
      <ThemedText type="caption" style={styles.heroStatLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  add: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    height: 168,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 1.04 }],
  },
  heroEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(62,224,183,0.35)',
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: 8,
  },
  heroTitle: {
    color: '#F6FAF8',
    letterSpacing: -0.8,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroStatValue: {
    color: '#F6FAF8',
  },
  heroStatLabel: {
    color: 'rgba(244,247,245,0.62)',
  },
  heroRule: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sectionKicker: {
    letterSpacing: 1.6,
    fontSize: 11,
  },
  lanes: {
    gap: 10,
    marginBottom: Spacing.four,
  },
  laneRow: {
    flexDirection: 'row',
    gap: 10,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
});
