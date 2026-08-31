import { Pressable, StyleSheet, View } from 'react-native';

import { ArtThumb } from '@/components/art-thumb';
import { CheckButton } from '@/components/check-button';
import { ThemedText } from '@/components/themed-text';
import { TypeBadge } from '@/components/type-badge';
import { formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import type { SupplementType } from '@/db/types';
import type { TodayDose } from '@/domain/doses';
import { formatTimeMinutes } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';

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
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: item.overdue && !taken ? theme.danger : theme.border,
          opacity: taken ? 0.55 : 1,
        },
      ]}>
      <View style={[styles.stripe, { backgroundColor: item.supplement.color }]} />
      <View style={styles.thumbWrap}>
        <ArtThumb type={item.supplement.type as SupplementType} />
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <ThemedText type="headline" numberOfLines={1} style={styles.name}>
            {item.supplement.name}
          </ThemedText>
          <TypeBadge type={item.supplement.type as SupplementType} />
        </View>
        <ThemedText type="callout" themeColor={item.overdue && !taken ? 'danger' : 'textSecondary'}>
          {formatDose(item.amount, item.unit)} · {formatTimeMinutes(timeMinutes)}
          {item.overdue && !taken ? ' · Overdue' : taken ? ' · Taken' : ''}
        </ThemedText>
      </View>
      <View style={styles.check}>
        <CheckButton checked={taken} overdue={item.overdue} onPress={onToggle} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 76,
  },
  stripe: {
    width: 6,
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
