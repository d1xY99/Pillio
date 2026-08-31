import { eq } from 'drizzle-orm';
import { useLiveQuery } from '@/db/live';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ArtThumb } from '@/components/art-thumb';
import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SupplementRow } from '@/components/supplement-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypeArtCard } from '@/components/type-art-card';
import { UiIcon } from '@/components/ui-icon';
import { TYPE_LABELS } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { doseLogs, supplements } from '@/db/schema';
import type { DoseUnit, SupplementType } from '@/db/types';
import { isWeeklySupplement, listTodayDoses } from '@/domain/doses';
import { takeDose, untakeDose } from '@/domain/logging';
import { describeSchedule, draftFromSchedules } from '@/domain/schedule';
import { listSchedulesForSupplement } from '@/db/queries/schedules';
import { useTheme } from '@/hooks/use-theme';

type StackFilter = 'daily' | 'weekly' | 'archived';

export default function StackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const db = getDb();
  const [filter, setFilter] = useState<StackFilter>('daily');
  const { data = [] } = useLiveQuery(
    db
      .select()
      .from(supplements)
      .where(eq(supplements.archived, filter === 'archived'))
      .orderBy(supplements.name),
    [filter],
  );
  const { updatedAt: doseTick } = useLiveQuery(db.select({ id: doseLogs.id }).from(doseLogs));

  const weeklyDue = useMemo(
    () => listTodayDoses(Date.now(), { weekly: true }),
    [doseTick, data],
  );
  const dueById = useMemo(
    () => new Map(weeklyDue.map((dose) => [dose.supplementId, dose])),
    [weeklyDue],
  );

  const visible = useMemo(() => {
    if (filter === 'archived') return data;
    return data.filter((item) => {
      const weekly = isWeeklySupplement(item.id);
      return filter === 'weekly' ? weekly : !weekly;
    });
  }, [data, filter]);

  const grouped = useMemo(() => {
    const order: SupplementType[] = ['vitamin', 'peptide', 'supplement'];
    return order
      .map((type) => ({
        type,
        items: visible.filter((item) => item.type === type),
      }))
      .filter((group) => group.items.length > 0);
  }, [visible]);

  const subtitle =
    filter === 'archived'
      ? 'Archived items'
      : filter === 'weekly'
        ? 'Once a week — stays off Today'
        : 'Daily vitamins, peptides, and supplements';

  return (
    <ThemedView style={styles.flex}>
      <Screen>
        <ScreenHeader
          title={filter === 'weekly' ? 'Weekly' : 'Stack'}
          subtitle={subtitle}
          right={
            filter !== 'archived' ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/supplement/form',
                    params: filter === 'weekly' ? { weekly: '1' } : {},
                  })
                }
                style={[styles.add, { backgroundColor: theme.accent }]}>
                <UiIcon name="plus" color="#06110D" size={14} />
                <ThemedText type="captionBold" style={styles.addLabel}>
                  Add
                </ThemedText>
              </Pressable>
            ) : null
          }
        />

        <View style={styles.filters}>
          {(['daily', 'weekly', 'archived'] as const).map((key) => {
            const active = filter === key;
            const label = key === 'daily' ? 'Daily' : key === 'weekly' ? 'Weekly' : 'Archived';
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? theme.accentMuted : theme.surface,
                    borderColor: active ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText type="captionBold" style={{ color: active ? theme.accent : theme.textSecondary }}>
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <FadeIn>
            {filter === 'daily' ? (
              <View style={styles.typeRow}>
                <TypeArtCard type="vitamin" delay={40} />
                <TypeArtCard type="peptide" delay={120} />
                <TypeArtCard type="supplement" delay={200} />
              </View>
            ) : null}
            <EmptyState
              icon="pills.fill"
              title={
                filter === 'archived'
                  ? 'Nothing archived'
                  : filter === 'weekly'
                    ? 'No weekly items'
                    : 'Build your stack'
              }
              body={
                filter === 'archived'
                  ? 'Archived items stay out of Today until you restore them.'
                  : filter === 'weekly'
                    ? 'Weekly supplements live here and never crowd Today. Add one and pick the day.'
                    : 'Daily items show on Today. Move once-a-week stuff to Weekly.'
              }
            />
          </FadeIn>
        ) : (
          <View style={styles.groups}>
            {grouped.map((group, index) => (
              <FadeIn key={group.type} delay={index * 80}>
                <View style={styles.group}>
                  <View style={styles.groupHead}>
                    <ArtThumb type={group.type} size={28} />
                    <ThemedText type="captionBold" themeColor="textTertiary">
                      {TYPE_LABELS[group.type].toUpperCase()}
                    </ThemedText>
                  </View>
                  {group.items.map((item) => {
                    const due = filter === 'weekly' ? dueById.get(item.id) : undefined;
                    const schedules = listSchedulesForSupplement(item.id);
                    const weeklyLabel =
                      filter === 'weekly'
                        ? due
                          ? due.takenAt
                            ? 'Taken this week'
                            : due.overdue
                              ? 'Due today'
                              : 'Due today'
                          : describeSchedule(draftFromSchedules(schedules))
                        : undefined;
                    return (
                      <SupplementRow
                        key={item.id}
                        item={item}
                        status={weeklyLabel}
                        check={
                          due
                            ? {
                                taken: Boolean(due.takenAt),
                                overdue: due.overdue,
                                onToggle: () => {
                                  if (due.takenAt) {
                                    void untakeDose(due.id);
                                  } else {
                                    void takeDose(due.id, {
                                      amount: item.defaultAmount,
                                      unit: item.defaultUnit as DoseUnit,
                                    });
                                  }
                                },
                              }
                            : undefined
                        }
                        onPress={() =>
                          router.push({ pathname: '/supplement/[id]', params: { id: item.id } })
                        }
                      />
                    );
                  })}
                </View>
              </FadeIn>
            ))}
          </View>
        )}
      </Screen>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.four,
  },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  addLabel: {
    color: '#06110D',
  },
  groups: {
    gap: Spacing.four,
    paddingBottom: 88,
  },
  group: {
    gap: Spacing.two,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
