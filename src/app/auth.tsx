import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const message =
      mode === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <ThemedText type="title">Cloud backup</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary" style={styles.lead}>
          Sign in to keep your stack if you delete the Home Screen icon or change phones.
        </ThemedText>

        {!configured ? (
          <ThemedText type="callout" themeColor="danger">
            Supabase keys are missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
          </ThemedText>
        ) : null}

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          {error ? (
            <ThemedText type="callout" themeColor="danger">
              {error}
            </ThemedText>
          ) : null}
          <Button
            label={busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
            disabled={busy || !configured}
            onPress={() => void submit()}
          />
          <Button
            label={mode === 'in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            variant="secondary"
            onPress={() => setMode(mode === 'in' ? 'up' : 'in')}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  form: {
    gap: Spacing.three,
  },
});
