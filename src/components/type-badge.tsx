import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TYPE_LABELS } from '@/constants/catalog';
import { Radius, Spacing } from '@/constants/theme';
import type { SupplementType } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

export function TypeBadge({ type }: { type: SupplementType }) {
  const theme = useTheme();
  const color = theme[type];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <ThemedText type="captionBold" style={{ color }}>
        {TYPE_LABELS[type]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
});
