import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiPatch } from '@/api/client';
import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { PressScale } from '@/components/press-scale';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { useLiveQuery } from '@/db/live';
import { setInventoryQuantity, updateSupplement } from '@/db/queries/supplements';
import { supplements, type Supplement } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { inventoryUnit, isLowStock } from '@/domain/inventory';
import { useTheme } from '@/hooks/use-theme';

export default function InventoryScreen() {
  const theme = useTheme();
  const db = getDb();
  const { data = [] } = useLiveQuery(
    db.select().from(supplements).where(eq(supplements.archived, false)).orderBy(supplements.name),
    [],
  );

  const tracked = data.filter((item) => item.trackInventory);
  const untracked = data.filter((item) => !item.trackInventory);
  const low = tracked.filter(isLowStock).length;

  return (
    <Screen>
      <ScreenHeader title="Inventory" subtitle="What you have" />

      {tracked.length > 0 ? (
        <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryStat}>
            <ThemedText type="headline">{tracked.length}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              tracked
            </ThemedText>
          </View>
          <View style={[styles.rule, { backgroundColor: theme.border }]} />
          <View style={styles.summaryStat}>
            <ThemedText type="headline" style={{ color: low ? theme.warning : theme.text }}>
              {low}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              running low
            </ThemedText>
          </View>
        </View>
      ) : null}

      {tracked.length === 0 ? (
        <FadeIn>
          <EmptyState
            icon="pills.fill"
            title="Nothing tracked yet"
            body="Turn on inventory for an item below and set how much you have left."
          />
        </FadeIn>
      ) : (
        <View style={styles.list}>
          {tracked.map((item, index) => (
            <FadeIn key={item.id} delay={index * 40}>
              <TrackedRow item={item} />
            </FadeIn>
          ))}
        </View>
      )}

      {untracked.length > 0 ? (
        <>
          <ThemedText type="captionBold" themeColor="textTertiary" style={styles.sectionKicker}>
            NOT TRACKED
          </ThemedText>
          <View style={styles.list}>
            {untracked.map((item) => (
              <UntrackedRow key={item.id} item={item} />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function TrackedRow({ item }: { item: Supplement }) {
  const theme = useTheme();
  const [value, setValue] = useState(
    item.quantityOnHand != null ? String(item.quantityOnHand) : '',
  );

  useEffect(() => {
    setValue(item.quantityOnHand != null ? String(item.quantityOnHand) : '');
  }, [item.quantityOnHand]);

  const unit = inventoryUnit(item);
  const step = item.defaultAmount > 0 ? item.defaultAmount : 1;
  const low = isLowStock(item);

  function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setInventoryQuantity(item.id, null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setInventoryQuantity(item.id, Math.round(parsed * 1000) / 1000);
  }

  function bump(sign: 1 | -1) {
    const base = item.quantityOnHand ?? 0;
    setInventoryQuantity(item.id, Math.max(0, Math.round((base + sign * step) * 1000) / 1000));
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: low ? `${theme.warning}66` : theme.border },
      ]}>
      <View style={[styles.stripe, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          <ThemedText type="headline" numberOfLines={1} style={styles.name}>
            {item.name}
          </ThemedText>
          {low ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: `${theme.warning}22`, borderColor: `${theme.warning}66` },
              ]}>
              <ThemedText type="captionBold" style={[styles.badgeText, { color: theme.warning }]}>
                LOW
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText type="title">
          {item.quantityOnHand == null ? 'Not set' : formatDose(item.quantityOnHand, unit)}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {item.lowStockThreshold == null
            ? 'No alert threshold set.'
            : `Alert below ${formatDose(item.lowStockThreshold, unit)}.`}
        </ThemedText>

        <View style={styles.controls}>
          <PressScale
            onPress={() => bump(-1)}
            style={[styles.stepButton, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
            <ThemedText type="headline">−</ThemedText>
          </PressScale>
          <View style={styles.field}>
            <TextField
              label={`Current (${unit})`}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </View>
          <PressScale
            onPress={() => bump(1)}
            style={[styles.stepButton, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
            <ThemedText type="headline">+</ThemedText>
          </PressScale>
          <PressScale
            onPress={save}
            style={[styles.saveButton, { backgroundColor: theme.accent }]}>
            <ThemedText type="captionBold" style={styles.saveLabel}>
              Save
            </ThemedText>
          </PressScale>
        </View>
      </View>
    </View>
  );
}

function UntrackedRow({ item }: { item: Supplement }) {
  const theme = useTheme();

  function track() {
    const patch = {
      trackInventory: true,
      inventoryUnit: item.defaultUnit as DoseUnit,
      refillReminder: true,
    };
    updateSupplement(item.id, patch);
    void apiPatch(`/stack/${item.id}`, patch).catch(() => undefined);
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.stripe, { backgroundColor: item.color }]} />
      <View style={[styles.cardBody, styles.untrackedBody]}>
        <View style={styles.field}>
          <ThemedText type="headline" numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDose(item.defaultAmount, item.defaultUnit)}
          </ThemedText>
        </View>
        <PressScale onPress={track} style={[styles.trackButton, { borderColor: theme.accent }]}>
          <ThemedText type="captionBold" style={{ color: theme.accent }}>
            Track
          </ThemedText>
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
    marginBottom: Spacing.four,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  rule: {
    width: 1,
    height: 26,
  },
  list: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  sectionKicker: {
    letterSpacing: 1.6,
    fontSize: 11,
    marginBottom: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stripe: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    letterSpacing: 0.8,
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    color: '#06110D',
  },
  untrackedBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  trackButton: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
