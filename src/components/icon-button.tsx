import { StyleSheet } from 'react-native';

import { PressScale } from '@/components/press-scale';
import { UiIcon, type UiIconName } from '@/components/ui-icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  name: UiIconName;
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
      <UiIcon name={name} color={theme.text} size={20} />
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
