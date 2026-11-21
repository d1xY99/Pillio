import { Tabs } from 'expo-router';

import { PillTabBar } from '@/components/pill-tab-bar';
import { useAdaptiveLayout } from '@/hooks/use-adaptive-layout';

export default function TabLayout() {
  const { rail } = useAdaptiveLayout();

  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Right-edge rail on the iPhone Duo inner display; floating bottom pill otherwise.
        tabBarPosition: rail ? 'right' : 'bottom',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="stack" options={{ title: 'Stack' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
      <Tabs.Screen name="train" options={{ title: 'Train' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
    </Tabs>
  );
}
