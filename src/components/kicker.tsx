import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Kicker({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: theme.accentMuted, borderColor: `${theme.accent}55` },
      ]}>
      <ThemedText type="captionBold" style={[styles.text, { color: theme.accent }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    letterSpacing: 1.6,
    fontSize: 11,
  },
});
