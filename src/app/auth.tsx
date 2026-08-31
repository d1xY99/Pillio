import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const logo = require('../../assets/images/pillio-logo.png');

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { signIn, signUp, configured, user, loading, hydrating } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !hydrating && user) router.replace('/');
  }, [loading, hydrating, user, router]);

  async function submit() {
    setError(null);
    if (mode === 'up') {
      if (!name.trim()) {
        setError('Enter your name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    setBusy(true);
    const message =
      mode === 'in'
        ? await signIn(email.trim(), password)
        : await signUp(name.trim(), email.trim(), password);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    router.replace('/');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Pillio" />
        </View>
        <View style={[styles.switch, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            onPress={() => {
              setMode('in');
              setError(null);
            }}
            style={[styles.switchBtn, mode === 'in' && { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="captionBold" style={{ color: mode === 'in' ? theme.accent : theme.textSecondary }}>
              Sign in
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode('up');
              setError(null);
            }}
            style={[styles.switchBtn, mode === 'up' && { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="captionBold" style={{ color: mode === 'up' ? theme.accent : theme.textSecondary }}>
              Create account
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="title">{mode === 'in' ? 'Sign in to continue' : 'Create your account'}</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary" style={styles.lead}>
          {mode === 'in'
            ? 'Your stack lives on your account. Sign in to open it on this phone.'
            : 'New here? Add your name so the backup is yours.'}
        </ThemedText>

        {!configured ? (
          <ThemedText type="callout" themeColor="danger">
            Supabase keys are missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
          </ThemedText>
        ) : null}

        <View style={styles.form}>
          {mode === 'up' ? (
            <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" autoFocus />
          ) : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoFocus={mode === 'in'}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'up' ? 'At least 6 characters' : 'Your password'}
            secureTextEntry
          />
          {mode === 'up' ? (
            <TextField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              secureTextEntry
            />
          ) : null}
          {error ? (
            <ThemedText type="callout" themeColor="danger">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label={busy || hydrating ? 'Loading your stack…' : mode === 'in' ? 'Sign in' : 'Create account'}
            disabled={busy || hydrating || !configured}
            onPress={() => void submit()}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  logo: {
    width: 96,
    height: 96,
  },
  switch: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 4,
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
    gap: 4,
  },
  switchBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  lead: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
});
