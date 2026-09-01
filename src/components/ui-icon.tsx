import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type UiIconName =
  | 'plus'
  | 'gearshape'
  | 'sun.max.fill'
  | 'pills.fill'
  | 'dumbbell.fill'
  | 'chart.line.uptrend.xyaxis'
  | 'checkmark'
  | 'checkmark.circle'
  | 'camera.fill'
  | 'xmark'
  | 'chevron.right'
  | 'lock.fill'
  | 'arrow.left';

const GLYPH: Record<UiIconName, string> = {
  plus: '+',
  gearshape: '⚙',
  'sun.max.fill': '☀',
  'pills.fill': '💊',
  'dumbbell.fill': '🏋',
  'chart.line.uptrend.xyaxis': '↗',
  checkmark: '✓',
  'checkmark.circle': '✓',
  'camera.fill': '◉',
  xmark: '✕',
  'chevron.right': '›',
  'lock.fill': '∗',
  'arrow.left': '←',
};

export function UiIcon({
  name,
  color,
  size = 22,
}: {
  name: UiIconName;
  color: string;
  size?: number;
}) {
  if (Platform.OS === 'web') {
    if (name === 'plus') return <PlusMark color={color} size={size} />;
    return (
      <Text style={{ color, fontSize: size * 0.9, fontWeight: '800', lineHeight: size, textAlign: 'center' }}>
        {GLYPH[name]}
      </Text>
    );
  }

  return <SymbolView name={name} tintColor={color} size={size} weight="medium" />;
}

function PlusMark({ color, size }: { color: string; size: number }) {
  const thickness = Math.max(3, Math.round(size / 7));
  const length = size * 0.58;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.bar, { width: length, height: thickness, backgroundColor: color, borderRadius: thickness }]} />
      <View
        style={[
          styles.bar,
          { width: thickness, height: length, backgroundColor: color, borderRadius: thickness },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
  },
});
