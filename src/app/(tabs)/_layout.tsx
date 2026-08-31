import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { UiIcon, type UiIconName } from '@/components/ui-icon';
import { useTheme } from '@/hooks/use-theme';

function TabIcon({ name, color }: { name: UiIconName; color: string }) {
  return <UiIcon name={name} color={color} size={22} />;
}

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: '#9AA3AB',
        tabBarStyle: {
          backgroundColor: '#111418',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.12)',
          elevation: 0,
          minHeight: Platform.OS === 'web' ? 72 : 56,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'web' ? 16 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          paddingBottom: 4,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabIcon name="sun.max.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="stack"
        options={{
          title: 'Stack',
          tabBarIcon: ({ color }) => <TabIcon name="pills.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <TabIcon name="dumbbell.fill" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <TabIcon name="chart.line.uptrend.xyaxis" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
