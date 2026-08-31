import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/confirm';
import {
  getReminderPermission,
  requestReminderPermission,
  sendTestReminder,
} from '@/notifications/permissions';
import { syncDoseReminders } from '@/notifications/sync';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, configured, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [webStatus, setWebStatus] = useState<
    'unsupported' | 'needs-install' | 'denied' | 'granted' | 'off'
  >('off');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [ntfyTopic, setNtfyTopic] = useState('');
  const web = Platform.OS === 'web';

  const refresh = useCallback(() => {
    if (web) {
      void import('@/notifications/web').then((mod) => {
        setNtfyTopic(mod.getNtfyTopic());
        return mod.getWebReminderStatus().then(setWebStatus);
      });
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
        <ThemedText type="headline">Account</ThemedText>
        {user ? (
          <>
            <ThemedText type="callout" themeColor="textSecondary">
              Signed in as {user.user_metadata?.display_name ? `${user.user_metadata.display_name} · ` : ''}
              {user.email}. Your stack is saved in the cloud. Sign out clears this phone; sign back
              in to load it.
            </ThemedText>
            <Button
              label={signingOut ? 'Signing out…' : 'Sign out'}
              variant="secondary"
              disabled={signingOut}
              onPress={() => {
                setSigningOut(true);
                void signOut()
                  .then(() => router.replace('/auth'))
                  .finally(() => setSigningOut(false));
              }}
            />
          </>
        ) : (
          <>
            <ThemedText type="callout" themeColor="textSecondary">
              {configured
                ? 'Sign in so deleting the Home Screen icon does not wipe your stack.'
                : 'Add Supabase keys to enable cloud backup (see supabase/README.md).'}
            </ThemedText>
            <Button
              label="Sign in / Create account"
              onPress={() => router.push('/auth')}
              disabled={!configured}
            />
          </>
        )}
      </View>

      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">Home Screen</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          Safari → Share → Add to Home Screen, then open Pillio from that icon so check-offs and
          reminders run on this phone.
        </ThemedText>
      </View>

      <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="headline">Reminders</ThemedText>
        {web ? (
          <>
            <ThemedText type="callout" themeColor="textSecondary">
              iPhone will not alert from Pillio itself while the phone is locked. Use ntfy (free) for
              lock-screen alerts. Pillio still only pings if the dose is unchecked.
            </ThemedText>
            <ThemedText type="captionBold" themeColor="accent">
              Topic: {ntfyTopic || '…'}
            </ThemedText>
            <Button
              label="Install ntfy"
              variant="secondary"
              onPress={() => void Linking.openURL('https://apps.apple.com/app/ntfy/id1625396347')}
            />
            <Button
              label="Subscribe in ntfy"
              onPress={() => {
                if (!ntfyTopic) return;
                void Linking.openURL(`https://ntfy.sh/${ntfyTopic}`);
              }}
            />
            <ThemedText type="caption" themeColor="textSecondary">
              In ntfy: Subscribe to topic → paste the topic above. Then send a test.
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
            <Button
              label="Send lock-screen test"
              onPress={() => {
                void import('@/notifications/web').then(({ enableWebReminders }) =>
                  enableWebReminders().then(() => {
                    setWebStatus('granted');
                    setTestStatus(
                      'If ntfy is subscribed, lock the phone — the test should still arrive.',
                    );
                  }),
                );
              }}
            />
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
                    showAlert(
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
          While signed in, this phone is a cache. The account in the cloud is the source of truth.
          Reminder times are also copied so a missed dose can ping you.
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
