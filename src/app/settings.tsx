import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getReminderPermission, requestReminderPermission } from '@/notifications/permissions';
import { syncDoseReminders } from '@/notifications/sync';

export default function SettingsScreen() {
  const theme = useTheme();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const web = Platform.OS === 'web';

  const refresh = useCallback(() => {
    void getReminderPermission().then(setPermission);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const permissionLabel =
    permission === 'granted' ? 'On' : permission === 'denied' ? 'Off' : 'Not set';

  return (
    <ThemedView style={styles.screen}>
      {web ? (
        <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="headline">Add to Home Screen</ThemedText>
          <ThemedText type="callout" themeColor="textSecondary">
            On iPhone, open this site in Safari, tap Share, then Add to Home Screen. You get a Pillio
            icon. Data stays in this browser.
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">Reminders</ThemedText>
        {web ? (
          <ThemedText type="callout" themeColor="textSecondary">
            Home Screen web mode cannot fire iOS notifications at 10:00. Open Today to see overdue
            doses. For real reminders, use Expo Go.
          </ThemedText>
        ) : (
          <>
            <ThemedText type="callout" themeColor="textSecondary">
              Notifications fire at the due time only if a dose is still unchecked. Checking it off
              early cancels that reminder.
            </ThemedText>
            <ThemedText type="captionBold" themeColor="accent">
              Status: {permissionLabel}
            </ThemedText>
            {permission !== 'granted' ? (
              <Button
                label={permission === 'denied' ? 'Open iOS Settings' : 'Allow notifications'}
                onPress={() => {
                  if (permission === 'denied') {
                    void Linking.openSettings();
                    return;
                  }
                  void requestReminderPermission().then((granted) => {
                    setPermission(granted ? 'granted' : 'denied');
                    if (granted) void syncDoseReminders();
                  });
                }}
              />
            ) : (
              <Pressable
                onPress={() => {
                  void syncDoseReminders();
                }}>
                <ThemedText type="callout" themeColor="accent">
                  Resync upcoming reminders
                </ThemedText>
              </Pressable>
            )}
          </>
        )}
      </View>

      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">Appearance</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          Follows your device light or dark setting.
        </ThemedText>
      </View>

      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">Data</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          Everything stays on this device. No account or cloud sync in v1.
        </ThemedText>
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
    gap: Spacing.two,
  },
  row: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
});
