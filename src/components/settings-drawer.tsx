import { useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { apiPost } from '@/api/client';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/confirm';
import {
  getReminderPermission,
  requestReminderPermission,
  sendTestReminder,
} from '@/notifications/permissions';
import { syncDoseReminders } from '@/notifications/sync';
import { useSettingsDrawer } from '@/settings/drawer-context';

type Panel = 'menu' | 'reminders' | 'password' | 'home';

export function SettingsDrawer() {
  const { open, hide } = useSettingsDrawer();
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<Panel>('menu');
  const [slide] = useState(() => new Animated.Value(0));
  const sheetWidth = Math.min(360, Math.round(width * 0.88));

  useEffect(() => {
    Animated.timing(slide, {
      toValue: open ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
    if (open) setPanel('menu');
  }, [open, slide]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetWidth, 0],
  });

  return (
    <View
      pointerEvents={open ? 'auto' : 'none'}
      importantForAccessibility={open ? 'yes' : 'no-hide-descendants'}
      accessibilityElementsHidden={!open}
      style={[StyleSheet.absoluteFill, styles.layer]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={hide}>
        <Animated.View
          style={[
            styles.scrim,
            { backgroundColor: theme.overlay, opacity: slide },
          ]}
        />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            width: sheetWidth,
            backgroundColor: theme.background,
            borderColor: theme.border,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateX }],
          },
        ]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            {panel !== 'menu' ? (
              <Pressable
                onPress={() => setPanel('menu')}
                hitSlop={12}
                style={styles.iconHit}
                accessibilityRole="button"
                accessibilityLabel="Back to menu">
                <UiIcon name="arrow.left" color={theme.text} size={18} />
              </Pressable>
            ) : (
              <View style={styles.iconHit} />
            )}
            <ThemedText type="headline">
              {panel === 'menu'
                ? 'Menu'
                : panel === 'reminders'
                  ? 'Reminders'
                  : panel === 'password'
                    ? 'Password'
                    : 'Home Screen'}
            </ThemedText>
            <Pressable
              onPress={hide}
              hitSlop={12}
              style={styles.iconHit}
              accessibilityRole="button"
              accessibilityLabel="Close menu">
              <UiIcon name="xmark" color={theme.text} size={16} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {panel === 'menu' ? (
              <MenuPanel
                onReminders={() => setPanel('reminders')}
                onPassword={() => setPanel('password')}
                onHome={() => setPanel('home')}
                onSignedOut={hide}
              />
            ) : null}
            {panel === 'reminders' ? <RemindersPanel /> : null}
            {panel === 'password' ? <PasswordPanel /> : null}
            {panel === 'home' ? <HomeScreenPanel /> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

function MenuPanel({
  onReminders,
  onPassword,
  onHome,
  onSignedOut,
}: {
  onReminders: () => void;
  onPassword: () => void;
  onHome: () => void;
  onSignedOut: () => void;
}) {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const initial = (user?.displayName || user?.email || 'P').slice(0, 1).toUpperCase();

  return (
    <View style={styles.section}>
      <View style={[styles.profile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentMuted }]}>
          <ThemedText type="headline" style={{ color: theme.accent }}>
            {initial}
          </ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText type="headline">{user?.displayName || 'Pillio'}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {user?.email}
          </ThemedText>
        </View>
      </View>

      <MenuRow label="Reminders" hint="Lock-screen alerts" onPress={onReminders} />
      <MenuRow label="Change password" hint="Update the password for this account" onPress={onPassword} />
      <MenuRow label="Home Screen" hint="Add Pillio to your phone" onPress={onHome} />

      <ThemedText type="caption" themeColor="textTertiary" style={styles.note}>
        This phone is a cache. The account in the cloud is the source of truth.
      </ThemedText>

      <Button
        label={signingOut ? 'Signing out…' : 'Sign out'}
        variant="danger"
        disabled={signingOut}
        onPress={() => {
          setSigningOut(true);
          void signOut().finally(() => {
            setSigningOut(false);
            onSignedOut();
          });
        }}
      />
      <ThemedText type="caption" themeColor="textTertiary" style={styles.version}>
        Pillio 1.0.0
      </ThemedText>
    </View>
  );
}

function MenuRow({ label, hint, onPress }: { label: string; hint: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.flex}>
        <ThemedText type="headline">{label}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>
      <UiIcon name="chevron.right" color={theme.textTertiary} size={22} />
    </Pressable>
  );
}

function PasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    setOk(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await apiPost('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      setOk('Password updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <ThemedText type="callout" themeColor="textSecondary">
        Enter your current password, then the new one.
      </ThemedText>
      <TextField
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Current password"
      />
      <TextField
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="At least 6 characters"
      />
      <TextField
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        placeholder="Repeat new password"
      />
      {error ? (
        <ThemedText type="callout" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      {ok ? (
        <ThemedText type="callout" themeColor="accent">
          {ok}
        </ThemedText>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Update password'} disabled={busy} onPress={() => void save()} />
    </View>
  );
}

function HomeScreenPanel() {
  return (
    <View style={styles.section}>
      <ThemedText type="callout" themeColor="textSecondary">
        Safari → Share → Add to Home Screen, then open Pillio from that icon so check-offs and
        reminders run on this phone.
      </ThemedText>
    </View>
  );
}

function RemindersPanel() {
  const web = Platform.OS === 'web';
  const [permission, setPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [webStatus, setWebStatus] = useState<
    'unsupported' | 'needs-install' | 'denied' | 'granted' | 'off'
  >('off');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [ntfyTopic, setNtfyTopic] = useState('');

  useEffect(() => {
    if (web) {
      void import('@/notifications/web').then((mod) => {
        setNtfyTopic(mod.getNtfyTopic());
        return mod.getWebReminderStatus().then(setWebStatus);
      });
      return;
    }
    void getReminderPermission().then(setPermission);
  }, [web]);

  if (web) {
    return (
      <View style={styles.section}>
        <ThemedText type="callout" themeColor="textSecondary">
          iPhone will not alert from Pillio itself while locked. Use ntfy (free) for lock-screen
          alerts. Pillio still only pings if the dose is unchecked.
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
                setTestStatus('If ntfy is subscribed, lock the phone — the test should still arrive.');
              }),
            );
          }}
        />
        {testStatus ? (
          <ThemedText type="caption" themeColor="accent">
            {testStatus}
          </ThemedText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ThemedText type="callout" themeColor="textSecondary">
        Notifications fire at the due time only if a dose is still unchecked.
      </ThemedText>
      <ThemedText type="captionBold" themeColor="accent">
        Status: {permission === 'granted' ? 'On' : permission === 'denied' ? 'Off' : 'Not set'}
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
        <Pressable onPress={() => void syncDoseReminders()}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  layer: { zIndex: 50 },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  iconHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
  },
  note: {
    lineHeight: 18,
  },
  version: {
    textAlign: 'center',
  },
});
