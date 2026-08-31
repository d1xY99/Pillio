import { and, gte, lte } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DoseRow } from '@/components/dose-row';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { takeDose, untakeDose } from '@/domain/logging';
import { doseLogs } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { overallStreak } from '@/domain/adherence';
import { ensureUpcomingDoses, groupDosesByTime, listTodayDoses } from '@/domain/doses';
import { endOfLocalDay, formatTimeMinutes, startOfLocalDay } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';

function formatToday() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());
}

export default function TodayScreen() {
  const router = useRouter();
  const theme = useTheme();
  const db = getDb();
  const [nowTick, setNowTick] = useState(0);
  const start = startOfLocalDay();
  const end = endOfLocalDay();

  useFocusEffect(
    useCallback(() => {
      ensureUpcomingDoses();
      setNowTick((value) => value + 1);
    }, []),
  );

  const { updatedAt } = useLiveQuery(
    db
      .select()
      .from(doseLogs)
      .where(and(gte(doseLogs.scheduledFor, start), lte(doseLogs.scheduledFor, end))),
    [start, end],
  );

  const doses = useMemo(
    () => listTodayDoses(),
    // logs and focus both should rebuild the joined view
    [updatedAt, nowTick],
  );
  const groups = groupDosesByTime(doses);
  const taken = doses.filter((dose) => dose.takenAt).length;
  const total = doses.length;
  const streak = useMemo(() => overallStreak(), [updatedAt, nowTick]);

  return (
    <Screen>
      <ScreenHeader
        title="Today"
        subtitle={formatToday()}
        right={
          <IconButton
            name="gearshape"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/settings')}
          />
        }
      />

      <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View
          style={[
            styles.ring,
            { borderColor: total > 0 && taken === total ? theme.accent : theme.border },
          ]}>
          <ThemedText type="headline">{taken}</ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            of {total}
          </ThemedText>
        </View>
        <View style={styles.summaryCopy}>
          <ThemedText type="headline">
            {total === 0 ? 'Nothing due' : taken === total ? 'Stack complete' : `${total - taken} remaining`}
          </ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            {streak > 0
              ? `${streak}-day streak. Reminders wait until the due time if a dose is still open.`
              : 'Check off what you take. Reminders wait until the due time if a dose is still open.'}
          </ThemedText>
        </View>
      </View>

      {total === 0 ? (
        <EmptyState
          icon="checkmark.circle"
          title="Your day is clear"
          body="Add vitamins, peptides, and supplements in Stack to see them here."
          actionLabel="Go to Stack"
          onAction={() => router.push('/stack')}
        />
      ) : (
        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.time} style={styles.group}>
              <ThemedText type="captionBold" themeColor="textTertiary">
                {formatTimeMinutes(group.time).toUpperCase()}
              </ThemedText>
              {group.items.map((item) => (
                <DoseRow
                  key={item.id}
                  item={item}
                  onPress={() =>
                    router.push({ pathname: '/supplement/[id]', params: { id: item.supplementId } })
                  }
                  onToggle={() => {
                    if (item.takenAt) {
                      void untakeDose(item.id);
                    } else {
                      void takeDose(item.id, {
                        amount: item.supplement.defaultAmount,
                        unit: item.supplement.defaultUnit as DoseUnit,
                      });
                    }
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  groups: {
    gap: Spacing.four,
  },
  group: {
    gap: Spacing.two,
  },
});
