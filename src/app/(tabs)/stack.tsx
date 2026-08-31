import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { Fab } from '@/components/fab';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { SupplementRow } from '@/components/supplement-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TYPE_LABELS } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { supplements } from '@/db/schema';
import type { SupplementType } from '@/db/types';
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
            <Pressable
              onPress={() => setShowArchived((value) => !value)}
              style={[styles.toggle, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <ThemedText type="captionBold" themeColor={showArchived ? 'accent' : 'textSecondary'}>
                {showArchived ? 'Active' : 'Archived'}
              </ThemedText>
            </Pressable>
          }
        />

        {data.length === 0 ? (
          <EmptyState
            icon="pills.fill"
            title={showArchived ? 'Nothing archived' : 'Nothing in your stack'}
            body={
              showArchived
                ? 'Archived items stay out of Today until you restore them.'
                : 'Track each item, its dose, and when it is due. History will show what you have used so far.'
            }
          />
        ) : (
          <View style={styles.groups}>
            {grouped.map((group) => (
              <View key={group.type} style={styles.group}>
                <ThemedText type="captionBold" themeColor="textTertiary">
                  {TYPE_LABELS[group.type].toUpperCase()}
                </ThemedText>
                {group.items.map((item) => (
                  <SupplementRow
                    key={item.id}
                    item={item}
                    onPress={() =>
                      router.push({ pathname: '/supplement/[id]', params: { id: item.id } })
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </Screen>
      {!showArchived ? (
        <Fab accessibilityLabel="Add to stack" onPress={() => router.push('/supplement/form')} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  toggle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  groups: {
    gap: Spacing.four,
    paddingBottom: 88,
  },
  group: {
    gap: Spacing.two,
  },
});
