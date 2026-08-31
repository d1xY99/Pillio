import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { initDatabase } from '@/db/client';
import { useTheme, useThemeName } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useTheme();
  const themeName = useThemeName();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initDatabase();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open local database');
    } finally {
      setReady(true);
      SplashScreen.hideAsync();
    }
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
    return <View style={[styles.boot, { backgroundColor: theme.background }]} />;
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
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.accent,
            headerTitleStyle: { color: theme.text, fontWeight: '600' },
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: 'Settings',
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
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
