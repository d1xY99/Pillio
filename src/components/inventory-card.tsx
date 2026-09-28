import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/press-scale';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import { setInventoryQuantity } from '@/db/queries/supplements';
import type { Supplement } from '@/db/schema';
import { inventoryUnit, isLowStock } from '@/domain/inventory';
import { useTheme } from '@/hooks/use-theme';

export function InventoryCard({ item }: { item: Supplement }) {
  const theme = useTheme();
  const [refill, setRefill] = useState('');

  if (!item.trackInventory) return null;

  const unit = inventoryUnit(item);
  const remaining = item.quantityOnHand;
  const packSize = item.inventoryPackSize;
  const byPack = packSize != null && packSize > 0;
  const per = packSize ?? 0;
  const container = item.type === 'peptide' ? 'vial' : 'container';
  const count = byPack && remaining != null ? Math.round((remaining / per) * 1000) / 1000 : null;
  const low = isLowStock(item);

  function addRefill() {
    const parsed = Number(refill);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const amount = byPack ? parsed * per : parsed;
    setInventoryQuantity(item.id, Math.round(((remaining ?? 0) + amount) * 1000) / 1000);
    setRefill('');
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.head}>
        <ThemedText type="captionBold" themeColor="textTertiary">
          INVENTORY
        </ThemedText>
        {low ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${theme.warning}22`, borderColor: `${theme.warning}66` },
            ]}>
            <ThemedText type="captionBold" style={[styles.badgeText, { color: theme.warning }]}>
              REFILL SOON
            </ThemedText>
          </View>
        ) : null}
      </View>

      <ThemedText type="title">
        {byPack
          ? `${count ?? 0} ${container}s`
          : remaining == null
            ? 'Not set'
            : formatDose(remaining, unit)}
      </ThemedText>
      {byPack ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {`${formatDose(remaining ?? 0, unit)} total · ${formatDose(per, unit)} per ${container}`}
        </ThemedText>
      ) : null}
      <ThemedText type="caption" themeColor="textSecondary">
        {item.lowStockThreshold == null
          ? 'No alert threshold set.'
          : `Alert below ${formatDose(item.lowStockThreshold, unit)}.`}
        {item.refillReminder ? ' Reminder on.' : ' Reminder off.'}
      </ThemedText>

      <View style={styles.refillRow}>
        <View style={styles.refillField}>
          <TextField
            label={byPack ? `Add (${container}s)` : `Add (${unit})`}
            value={refill}
            onChangeText={setRefill}
            keyboardType="decimal-pad"
            placeholder={byPack ? '1' : '30'}
          />
        </View>
        <PressScale
          onPress={addRefill}
          style={[styles.refillButton, { backgroundColor: theme.accent }]}>
          <ThemedText type="captionBold" style={styles.refillLabel}>
            Refill
          </ThemedText>
        </PressScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  refillRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  refillField: {
    flex: 1,
  },
  refillButton: {
    minHeight: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refillLabel: {
    color: '#06110D',
  },
});
