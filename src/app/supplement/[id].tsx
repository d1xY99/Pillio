import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { TypeBadge } from '@/components/type-badge';
import { FORM_LABELS, formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { setSupplementArchived } from '@/db/queries/supplements';
import { supplements } from '@/db/schema';
import type { SupplementForm, SupplementType } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

export default function SupplementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const db = getDb();
  const { data, updatedAt } = useLiveQuery(
    db.select().from(supplements).where(eq(supplements.id, id ?? '')),
    [id],
  );
  const item = data[0];

  useEffect(() => {
    navigation.setOptions({ title: item?.name ?? 'Supplement' });
  }, [item?.name, navigation]);

  if (!updatedAt) {
    return <Screen><ThemedText themeColor="textSecondary">Loading…</ThemedText></Screen>;
  }

  if (!item) {
    return (
      <Screen>
        <ThemedText type="headline">Item not found</ThemedText>
      </Screen>
    );
  }

  function archive() {
    Alert.alert(
      item.archived ? 'Restore this item?' : 'Archive this item?',
      item.archived
        ? 'It will show up in your stack and Today again.'
        : 'It will leave Today and the active stack. History stays on the device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item.archived ? 'Restore' : 'Archive',
          style: item.archived ? 'default' : 'destructive',
          onPress: () => {
            setSupplementArchived(item.id, !item.archived);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <TypeBadge type={item.type as SupplementType} />
        <ThemedText type="display">{formatDose(item.defaultAmount, item.defaultUnit)}</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          {FORM_LABELS[item.form as SupplementForm]}
        </ThemedText>
      </View>

      {item.notes ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="captionBold" themeColor="textTertiary">
            NOTES
          </ThemedText>
          <ThemedText type="body">{item.notes}</ThemedText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Edit"
          variant="secondary"
          onPress={() =>
            router.push({ pathname: '/supplement/form', params: { id: item.id } })
          }
        />
        <Button
          label={item.archived ? 'Restore' : 'Archive'}
          variant={item.archived ? 'primary' : 'danger'}
          onPress={archive}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
