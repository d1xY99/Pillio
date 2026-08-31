import { eq } from 'drizzle-orm';
import { useLiveQuery } from '@/db/live';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/button';
import { Heatmap } from '@/components/heatmap';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { TypeBadge } from '@/components/type-badge';
import { TYPE_ART } from '@/constants/art';
import { FORM_LABELS, formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { listDoseHistory } from '@/db/queries/doses';
import { listSchedulesForSupplement } from '@/db/queries/schedules';
import { setSupplementArchived } from '@/db/queries/supplements';
import { doseLogs, supplements } from '@/db/schema';
import type { SupplementForm, SupplementType } from '@/db/types';
import { adherenceDays } from '@/domain/adherence';
import { ensureDosesForRange } from '@/domain/doses';
import { draftFromSchedules, describeSchedule } from '@/domain/schedule';
import { addLocalDays, endOfLocalDay, formatDateTime, startOfLocalDay } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';
import { syncDoseReminders } from '@/notifications/sync';

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
  const { updatedAt: doseTick } = useLiveQuery(
    db.select().from(doseLogs).where(eq(doseLogs.supplementId, id ?? '')),
    [id],
  );
  const item = data[0];

  useEffect(() => {
    navigation.setOptions({ title: item?.name ?? 'Supplement' });
  }, [item?.name, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      const rows = listSchedulesForSupplement(id);
      const earliest = rows.length
        ? Math.min(...rows.map((row) => startOfLocalDay(row.startDate)))
        : startOfLocalDay();
      const from = Math.max(earliest, addLocalDays(startOfLocalDay(), -83));
      ensureDosesForRange(from, endOfLocalDay());
    }, [id]),
  );

  const schedules = item ? listSchedulesForSupplement(item.id) : [];
  const scheduleLabel = describeSchedule(draftFromSchedules(schedules));
  const history = useMemo(
    () => (item ? listDoseHistory(item.id, 40) : []),
    [item, doseTick],
  );
  const heat = useMemo(() => (item ? adherenceDays(item.id) : []), [item, doseTick]);

  if (!updatedAt) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Loading…</ThemedText>
      </Screen>
    );
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
            void syncDoseReminders();
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Image
          source={TYPE_ART[item.type as SupplementType]}
          style={styles.heroImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(11,13,16,0.2)', 'rgba(11,13,16,0.92)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroCopy}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <TypeBadge type={item.type as SupplementType} />
          <ThemedText type="display">{formatDose(item.defaultAmount, item.defaultUnit)}</ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            {FORM_LABELS[item.form as SupplementForm]}
          </ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            {schedules.length ? scheduleLabel : 'No schedule yet'}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="captionBold" themeColor="textTertiary">
          ADHERENCE
        </ThemedText>
        <Heatmap days={heat} />
      </View>

      {item.notes ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="captionBold" themeColor="textTertiary">
            NOTES
          </ThemedText>
          <ThemedText type="body">{item.notes}</ThemedText>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="captionBold" themeColor="textTertiary">
          DOSE HISTORY
        </ThemedText>
        {history.length === 0 ? (
          <ThemedText type="callout" themeColor="textSecondary">
            Nothing logged yet. Check off doses on Today to build history.
          </ThemedText>
        ) : (
          history.map((dose) => (
            <View key={dose.id} style={styles.historyRow}>
              <ThemedText type="callout">{formatDateTime(dose.scheduledFor)}</ThemedText>
              <ThemedText
                type="captionBold"
                themeColor={dose.takenAt ? 'accent' : dose.skipped ? 'textTertiary' : 'danger'}>
                {dose.takenAt
                  ? `${formatDose(dose.amount, dose.unit)} taken`
                  : dose.skipped
                    ? 'Skipped'
                    : 'Open'}
              </ThemedText>
            </View>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <Button
          label="Edit"
          variant="secondary"
          onPress={() => router.push({ pathname: '/supplement/form', params: { id: item.id } })}
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
    overflow: 'hidden',
    minHeight: 220,
    marginBottom: Spacing.three,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroCopy: {
    padding: Spacing.four,
    gap: Spacing.two,
    minHeight: 220,
    justifyContent: 'flex-end',
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
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
});
