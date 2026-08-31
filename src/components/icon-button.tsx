import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet } from 'react-native';

import { PressScale } from '@/components/press-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  name: SymbolViewProps['name'];
  onPress?: () => void;
  accessibilityLabel: string;
};

export function IconButton({ name, onPress, accessibilityLabel }: IconButtonProps) {
  const theme = useTheme();

  return (
    <PressScale
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <SymbolView
        name={name}
        tintColor={theme.text}
        size={20}
        weight="medium"
        accessibilityLabel={accessibilityLabel}
      />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.one,
  },
});
