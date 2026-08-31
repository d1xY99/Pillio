import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function GlassCard({
  children,
  style,
  glow = false,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  padded?: boolean;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: glow ? theme.accent : '#000',
          shadowOpacity: glow ? 0.22 : 0.35,
          shadowRadius: glow ? 28 : 18,
          shadowOffset: { width: 0, height: 10 },
        },
        style,
      ]}>
      <View style={styles.shine} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  padded: {
    padding: 18,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});
