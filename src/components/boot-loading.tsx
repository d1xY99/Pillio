import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function BootLoading({ message = 'Loading your stack…' }: { message?: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.accent} />
      <ThemedText type="callout" themeColor="textSecondary" style={styles.caption}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  caption: {
    textAlign: 'center',
  },
});
