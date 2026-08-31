import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TypeBadge } from '@/components/type-badge';
import { FORM_LABELS, formatDose } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import type { Supplement } from '@/db/schema';
import type { SupplementForm, SupplementType } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

export function SupplementRow({
  item,
  onPress,
}: {
  item: Supplement;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <View style={[styles.stripe, { backgroundColor: item.color }]} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText type="headline" style={styles.name} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <TypeBadge type={item.type as SupplementType} />
        </View>
        <ThemedText type="callout" themeColor="textSecondary">
          {formatDose(item.defaultAmount, item.defaultUnit)} · {FORM_LABELS[item.form as SupplementForm]}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 76,
  },
  stripe: {
    width: 6,
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
});
