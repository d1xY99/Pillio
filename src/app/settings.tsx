import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getReminderPermission,
  requestReminderPermission,
  sendTestReminder,
} from '@/notifications/permissions';
import { syncDoseReminders } from '@/notifications/sync';

export default function SettingsScreen() {
  const theme = useTheme();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [webStatus, setWebStatus] = useState<
    'unsupported' | 'needs-install' | 'denied' | 'granted' | 'off'
  >('off');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const web = Platform.OS === 'web';

  const refresh = useCallback(() => {
    if (web) {
      void import('@/notifications/web').then((mod) => mod.getWebReminderStatus().then(setWebStatus));
      return;
    }
    void getReminderPermission().then(setPermission);
  }, [web]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const permissionLabel =
    permission === 'granted' ? 'On' : permission === 'denied' ? 'Off' : 'Not set';

  return (
    <ThemedView style={styles.screen}>
      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">This phone is enough</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          Open https://pillioo.netlify.app from the Home Screen icon. Checking off a dose does not
          need a laptop.
        </ThemedText>
      </View>

      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">Reminders</ThemedText>
        {web ? (
          <>
            <ThemedText type="callout" themeColor="textSecondary">
              Alerts fire around the due time only if the dose is still unchecked. On iPhone you must
              open Pillio from the Home Screen icon, then allow notifications.
            </ThemedText>
            <ThemedText type="captionBold" themeColor="accent">
              Status:{' '}
              {webStatus === 'granted'
                ? 'On'
                : webStatus === 'needs-install'
                  ? 'Add to Home Screen first'
                  : webStatus === 'denied'
                    ? 'Blocked'
                    : webStatus === 'unsupported'
                      ? 'Not supported here'
                      : 'Off'}
            </ThemedText>
            {webStatus === 'needs-install' ? (
              <ThemedText type="callout" themeColor="textSecondary">
                Safari → Share → Add to Home Screen, then open the icon and come back here.
              </ThemedText>
            ) : (
              <Button
                label={webStatus === 'granted' ? 'Resync reminders' : 'Allow notifications'}
                onPress={() => {
                  void import('@/notifications/web').then(({ enableWebReminders }) =>
                    enableWebReminders().then((ok) => {
                    setWebStatus(ok ? 'granted' : 'denied');
                    setTestStatus(
                      ok
                        ? 'Alerts are on. Keep Reminder enabled on each supplement.'
                        : 'Could not enable alerts. Open Pillio from the Home Screen icon and try again.',
                    );
                    }),
                  );
                }}
              />
            )}
            {testStatus ? (
              <ThemedText type="caption" themeColor="accent">
                {testStatus}
              </ThemedText>
            ) : null}
          </>
        ) : (
          <>
            <ThemedText type="callout" themeColor="textSecondary">
              Notifications fire at the due time only if a dose is still unchecked.
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
            <Button
              label="Send test alert in 8 seconds"
              variant="secondary"
              onPress={() => {
                void sendTestReminder().then((ok) => {
                  if (!ok) {
                    Alert.alert(
                      'Allow notifications first',
                      'Pillio cannot schedule alerts until notifications are allowed.',
                    );
                    return;
                  }
                  setTestStatus('Lock the phone. You should get a Pillio alert in about 8 seconds.');
                });
              }}
            />
            {testStatus ? (
              <ThemedText type="caption" themeColor="accent">
                {testStatus}
              </ThemedText>
            ) : null}
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
          Doses stay on this phone. Reminder times are copied to the server only so a missed dose can
          ping you.
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
