import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { GlassCard } from '@/components/glass-card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  icon: SymbolViewProps['name'];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <GlassCard style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accentMuted }]}>
        <SymbolView name={icon} tintColor={theme.accent} size={28} weight="medium" />
      </View>
      <ThemedText type="headline">{title}</ThemedText>
      <ThemedText type="callout" themeColor="textSecondary" style={styles.body}>
        {body}
      </ThemedText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  body: {
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
});
