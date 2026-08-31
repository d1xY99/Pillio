import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'web' ? 64 : undefined,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="sun.max.fill" tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stack"
        options={{
          title: 'Stack',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="pills.fill" tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="dumbbell.fill" tintColor={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <SymbolView name="chart.line.uptrend.xyaxis" tintColor={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
