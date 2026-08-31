import { Text } from 'react-native';

import { PressScale } from '@/components/press-scale';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled }: ButtonProps) {
  const theme = useTheme();
  const backgroundColor =
    variant === 'primary' ? theme.accent : variant === 'danger' ? theme.danger : theme.surfaceRaised;
  const textColor = variant === 'primary' ? '#06110D' : variant === 'danger' ? '#FFFFFF' : theme.text;

  return (
    <PressScale
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 54,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.four,
        backgroundColor,
        borderWidth: 1,
        borderColor: variant === 'secondary' ? theme.border : 'rgba(255,255,255,0.12)',
        opacity: disabled ? 0.45 : 1,
        shadowColor: variant === 'primary' ? theme.accent : '#000',
        shadowOpacity: variant === 'primary' ? 0.35 : 0,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      }}>
      <Text
        style={{
          color: textColor,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: 0.2,
        }}>
        {label}
      </Text>
    </PressScale>
  );
}
