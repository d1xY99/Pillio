import { StyleSheet, View } from 'react-native';

import { ArtThumb } from '@/components/art-thumb';
import { CheckButton } from '@/components/check-button';
import { PressScale } from '@/components/press-scale';
import { ThemedText } from '@/components/themed-text';
import { TypeBadge } from '@/components/type-badge';
import { FORM_LABELS, formatDose } from '@/constants/catalog';
import { inventoryUnit, isLowStock } from '@/domain/inventory';
import { formatPeptideDraw } from '@/domain/peptide';
import { Radius, Spacing } from '@/constants/theme';
import type { Supplement } from '@/db/schema';
import type { SupplementForm, SupplementType } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

export function SupplementRow({
  item,
  onPress,
  status,
  check,
}: {
  item: Supplement;
  onPress: () => void;
  status?: string;
  check?: { taken: boolean; overdue?: boolean; onToggle: () => void };
}) {
  const theme = useTheme();
  const tracked = item.trackInventory && item.quantityOnHand != null;
  const low = isLowStock(item);

  return (
    <PressScale onPress={onPress}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}>
        <View style={[styles.stripe, { backgroundColor: item.color }]} />
        <View style={styles.thumbWrap}>
          <ArtThumb type={item.type as SupplementType} size={54} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <ThemedText type="headline" style={styles.name} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <TypeBadge type={item.type as SupplementType} />
            {low ? (
              <View
                style={[
                  styles.lowBadge,
                  { backgroundColor: `${theme.warning}22`, borderColor: `${theme.warning}66` },
                ]}>
                <ThemedText type="captionBold" style={[styles.lowText, { color: theme.warning }]}>
                  LOW
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText type="callout" themeColor="textSecondary">
            {[
              formatDose(item.defaultAmount, item.defaultUnit),
              formatPeptideDraw(
                item.vialMg,
                item.bacMl,
                item.defaultAmount,
                item.defaultUnit,
                item.drawDisplay === 'ml' ? 'ml' : 'units',
              ),
              FORM_LABELS[item.form as SupplementForm],
              tracked ? `${formatDose(item.quantityOnHand!, inventoryUnit(item))} left` : null,
              status,
            ]
              .filter(Boolean)
              .join(' · ')}
          </ThemedText>
        </View>
        {check ? (
          <View style={styles.check}>
            <CheckButton checked={check.taken} overdue={check.overdue} onPress={check.onToggle} />
          </View>
        ) : null}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 84,
  },
  stripe: {
    width: 3,
  },
  thumbWrap: {
    paddingLeft: Spacing.two,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  lowBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lowText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  check: {
    paddingRight: Spacing.three,
    justifyContent: 'center',
  },
});
