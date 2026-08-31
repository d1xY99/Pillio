import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const rows = [
  {
    title: 'Reminders',
    body: 'Notifications fire at the due time only if a dose is still unchecked.',
  },
  {
    title: 'Appearance',
    body: 'Follows your device light or dark setting.',
  },
  {
    title: 'Data',
    body: 'Everything stays on this device. No account or cloud sync in v1.',
  },
];

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <View style={styles.list}>
        {rows.map((row) => (
          <View
            key={row.title}
            style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText type="headline">{row.title}</ThemedText>
            <ThemedText type="callout" themeColor="textSecondary">
              {row.body}
            </ThemedText>
          </View>
        ))}
      </View>
      <ThemedText type="caption" themeColor="textTertiary" style={styles.version}>
        Pillio 1.0.0
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  version: {
    textAlign: 'center',
  },
});
