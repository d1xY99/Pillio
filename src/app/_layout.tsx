import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { BootLoading } from '@/components/boot-loading';
import { ThemedText } from '@/components/themed-text';
import { initDatabase } from '@/db/client';
import { ensureUpcomingDoses } from '@/domain/doses';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import '@/notifications/handler';
import { syncDoseReminders } from '@/notifications/sync';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const themeName = useThemeName();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await initDatabase();
        if (cancelled) return;
        if (Platform.OS === 'web') {
          const { registerWebServiceWorker, startReminderWatchdog } = await import('@/notifications/web');
          await registerWebServiceWorker();
          startReminderWatchdog();
        }
        const { isSupabaseConfigured } = await import('@/lib/supabase');
        if (!isSupabaseConfigured()) {
          ensureUpcomingDoses();
          void syncDoseReminders();
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Could not open local database');
        }
      } finally {
        if (!cancelled) {
          setReady(true);
          SplashScreen.hideAsync();
        }
      }
    })();

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        try {
          ensureUpcomingDoses();
          void syncDoseReminders();
        } catch {
          // database may still be opening
        }
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const navigationTheme = {
    ...(themeName === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeName === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.accent,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
  };

  if (!ready) {
    return <BootLoading message="Starting Pillio…" />;
  }

  if (error) {
    return (
      <View style={[styles.boot, styles.error, { backgroundColor: theme.background }]}>
        <ThemedText type="headline">Could not start Pillio</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          {error}
        </ThemedText>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.background }}>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const { user, loading, hydrating } = useAuth();

  useEffect(() => {
    if (loading || hydrating) return;
    const onAuth = segments[0] === 'auth';
    if (!user && !onAuth) router.replace('/auth');
    else if (user && onAuth) router.replace('/');
  }, [loading, hydrating, user, segments, router]);

  if (loading || hydrating) {
    return <BootLoading />;
  }

  const signedIn = Boolean(user);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.accent,
        headerTitleStyle: { color: theme.text, fontWeight: '600' },
        headerShadowVisible: false,
      }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Settings',
          }}
        />
        <Stack.Screen
          name="supplement/[id]"
          options={{
            headerShown: true,
            title: 'Supplement',
          }}
        />
        <Stack.Screen
          name="supplement/form"
          options={{
            headerShown: true,
            title: 'Add to stack',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="workout/[id]"
          options={{
            headerShown: true,
            title: 'Workout',
          }}
        />
        <Stack.Screen
          name="exercise/[id]"
          options={{
            headerShown: true,
            title: 'Exercise',
          }}
        />
        <Stack.Screen
          name="exercise/picker"
          options={{
            headerShown: true,
            title: 'Add exercise',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="photo/compare"
          options={{
            headerShown: true,
            title: 'Compare photos',
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
  },
  error: {
    padding: 24,
    justifyContent: 'center',
    gap: 8,
  },
});
