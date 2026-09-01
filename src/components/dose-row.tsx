import { StyleSheet, View } from 'react-native';

import { ArtThumb } from '@/components/art-thumb';
import { CheckButton } from '@/components/check-button';
import { PressScale } from '@/components/press-scale';
import { ThemedText } from '@/components/themed-text';
import { TypeBadge } from '@/components/type-badge';
import { formatDose } from '@/constants/catalog';
import { formatPeptideDraw } from '@/domain/peptide';
import { Radius, Spacing } from '@/constants/theme';
import type { SupplementType } from '@/db/types';
import type { TodayDose } from '@/domain/doses';
import { formatTimeMinutes } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';

function formatDoseLine(item: TodayDose, timeMinutes: number, taken: boolean) {
  const draw = formatPeptideDraw(
    item.supplement.vialMg,
    item.supplement.bacMl,
    item.amount,
    item.unit,
    item.supplement.drawDisplay === 'ml' ? 'ml' : 'units',
  );
  const bits = [formatDose(item.amount, item.unit)];
  if (draw) bits.push(draw);
  bits.push(formatTimeMinutes(timeMinutes));
  if (item.overdue && !taken) bits.push('Overdue');
  else if (taken) bits.push('Taken');
  return bits.join(' · ');
}

export function DoseRow({
  item,
  onToggle,
  onPress,
}: {
  item: TodayDose;
  onToggle: () => void;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const taken = Boolean(item.takenAt);
  const time = new Date(item.scheduledFor);
  const timeMinutes = time.getHours() * 60 + time.getMinutes();

  return (
    <PressScale onPress={onPress}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.surface,
            borderColor: item.overdue && !taken ? `${theme.danger}99` : theme.border,
            opacity: taken ? 0.5 : 1,
          },
        ]}>
        <View style={[styles.stripe, { backgroundColor: item.supplement.color }]} />
        <View style={styles.thumbWrap}>
          <ArtThumb type={item.supplement.type as SupplementType} size={54} />
        </View>
        <View style={styles.body}>
          <View style={styles.top}>
            <ThemedText type="headline" numberOfLines={1} style={styles.name}>
              {item.supplement.name}
            </ThemedText>
            <TypeBadge type={item.supplement.type as SupplementType} />
          </View>
          <ThemedText type="callout" themeColor={item.overdue && !taken ? 'danger' : 'textSecondary'}>
            {formatDoseLine(item, timeMinutes, taken)}
          </ThemedText>
        </View>
        <View style={styles.check}>
          <CheckButton checked={taken} overdue={item.overdue} onPress={onToggle} />
        </View>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 84,
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  thumbWrap: {
    paddingLeft: Spacing.two,
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  check: {
    paddingRight: Spacing.three,
  },
});
