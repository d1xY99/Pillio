import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
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
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
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
  },
  action: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
});
