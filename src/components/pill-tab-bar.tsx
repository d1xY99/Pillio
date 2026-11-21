import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabGlyph } from '@/components/tab-glyphs';
import { RAIL_WIDTH, useAdaptiveLayout } from '@/hooks/use-adaptive-layout';

const LABELS: Record<string, string> = {
  index: 'Today',
  stack: 'Stack',
  habits: 'Habits',
  notes: 'Notes',
  train: 'Train',
  progress: 'Body',
  analytics: 'Stats',
};

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
};

export function PillTabBar(props: TabBarProps) {
  const { rail } = useAdaptiveLayout();
  return rail ? <RailTabBar {...props} /> : <BottomTabBar {...props} />;
}

function BottomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const color = focused ? '#3EE0B7' : '#8B939C';
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              style={[styles.item, focused && styles.itemActive]}>
              <TabGlyph route={route.name} color={color} />
              <Text style={[styles.label, { color }]}>{LABELS[route.name] ?? route.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Vertical tab bar on the right edge — where iOS puts tab bars on the iPhone Duo inner
 * display, under the status bar, and out of the way of the fold.
 */
function RailTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { height } = useAdaptiveLayout();
  const top = Math.max(insets.top, 12);
  const bottom = Math.max(insets.bottom, 12);
  const count = Math.max(state.routes.length, 1);
  const itemHeight = Math.min(58, Math.floor((height - top - bottom - 8) / count));
  const showLabels = itemHeight >= 44;

  return (
    <View
      style={[
        styles.railWrap,
        {
          paddingTop: top,
          paddingBottom: bottom,
          paddingRight: Math.max(insets.right, 8),
          width: RAIL_WIDTH + insets.right,
        },
      ]}>
      <View style={styles.rail} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const color = focused ? '#3EE0B7' : '#8B939C';
          const label = LABELS[route.name] ?? route.name;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              style={[styles.railItem, { height: itemHeight }, focused && styles.itemActive]}>
              <TabGlyph route={route.name} color={color} />
              {showLabels ? <Text style={[styles.railLabel, { color }]}>{label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    marginHorizontal: 10,
    backgroundColor: '#12151C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 3,
    gap: 1,
    width: '96%',
    maxWidth: 520,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 18,
    gap: 3,
  },
  itemActive: {
    backgroundColor: 'rgba(62,224,183,0.12)',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  railWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rail: {
    width: RAIL_WIDTH - 12,
    backgroundColor: '#12151C',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 3,
    gap: 1,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  railItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    gap: 3,
  },
  railLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
