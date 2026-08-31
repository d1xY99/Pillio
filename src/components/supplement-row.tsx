import { StyleSheet, View } from 'react-native';

import { ArtThumb } from '@/components/art-thumb';
import { PressScale } from '@/components/press-scale';
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
          </View>
          <ThemedText type="callout" themeColor="textSecondary">
            {formatDose(item.defaultAmount, item.defaultUnit)} · {FORM_LABELS[item.form as SupplementForm]}
          </ThemedText>
        </View>
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
});
