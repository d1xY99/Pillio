import { SymbolView } from 'expo-symbols';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressScale } from '@/components/press-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FabProps = {
  onPress: () => void;
  accessibilityLabel: string;
};

export function Fab({ onPress, accessibilityLabel }: FabProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.fab,
        {
          backgroundColor: theme.accent,
          bottom: Math.max(insets.bottom, Spacing.three) + 16,
          shadowColor: theme.accent,
        },
      ]}>
      <SymbolView
        name="plus"
        tintColor="#06110D"
        size={26}
        weight="bold"
        accessibilityLabel={accessibilityLabel}
      />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
});
