import { eq } from 'drizzle-orm';
import { useLiveQuery } from '@/db/live';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ArtThumb } from '@/components/art-thumb';
import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { MenuButton } from '@/components/menu-button';
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
import { supplements } from '@/db/schema';
import type { SupplementType } from '@/db/types';
import { isWeeklySupplement } from '@/domain/doses';
import { describeSchedule, draftFromSchedules } from '@/domain/schedule';
import { listSchedulesForSupplement } from '@/db/queries/schedules';
import { useTheme } from '@/hooks/use-theme';

export default function StackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const db = getDb();
  const [showArchived, setShowArchived] = useState(false);
  const { data = [] } = useLiveQuery(
    db
      .select()
      .from(supplements)
      .where(eq(supplements.archived, showArchived))
      .orderBy(supplements.name),
    [showArchived],
  );

  const grouped = useMemo(() => {
    const order: SupplementType[] = ['vitamin', 'peptide', 'supplement'];
    return order
      .map((type) => ({
        type,
        items: data.filter((item) => item.type === type),
      }))
      .filter((group) => group.items.length > 0);
  }, [data]);

  return (
    <ThemedView style={styles.flex}>
      <Screen>
        <ScreenHeader
          title="Stack"
          subtitle={showArchived ? 'Archived items' : 'Vitamins, peptides, and supplements'}
          right={
            <View style={styles.headerActions}>
              <MenuButton />
              <Pressable
                onPress={() => setShowArchived((value) => !value)}
                style={[styles.toggle, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <ThemedText type="captionBold" themeColor={showArchived ? 'accent' : 'textSecondary'}>
                  {showArchived ? 'Active' : 'Archived'}
                </ThemedText>
              </Pressable>
              {!showArchived ? (
                <Pressable
                  onPress={() => router.push('/supplement/form')}
                  style={[styles.add, { backgroundColor: theme.accent }]}>
                  <UiIcon name="plus" color="#06110D" size={14} />
                  <ThemedText type="captionBold" style={styles.addLabel}>
                    Add
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          }
        />

        {data.length === 0 ? (
          <FadeIn>
            {!showArchived ? (
              <View style={styles.typeRow}>
                <TypeArtCard type="vitamin" delay={40} />
                <TypeArtCard type="peptide" delay={120} />
                <TypeArtCard type="supplement" delay={200} />
              </View>
            ) : null}
            <EmptyState
              icon="pills.fill"
              title={showArchived ? 'Nothing archived' : 'Build your stack'}
              body={
                showArchived
                  ? 'Archived items stay out of Today until you restore them.'
                  : 'Set Frequency to Weekly for once-a-week items. They stay off Today until their day.'
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
                  {group.items.map((item) => (
                    <SupplementRow
                      key={item.id}
                      item={item}
                      status={
                        isWeeklySupplement(item.id)
                          ? describeSchedule(draftFromSchedules(listSchedulesForSupplement(item.id)))
                          : undefined
                      }
                      onPress={() =>
                        router.push({ pathname: '/supplement/[id]', params: { id: item.id } })
                      }
                    />
                  ))}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
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
