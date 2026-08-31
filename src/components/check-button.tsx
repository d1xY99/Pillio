import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { UiIcon } from '@/components/ui-icon';
import { useTheme } from '@/hooks/use-theme';

type CheckButtonProps = {
  checked: boolean;
  overdue?: boolean;
  onPress: () => void;
};

export function CheckButton({ checked, overdue, onPress }: CheckButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const borderColor = checked ? theme.accent : overdue ? theme.danger : theme.border;
  const backgroundColor = checked ? theme.accent : 'transparent';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={checked ? 'Undo dose' : 'Mark as taken'}
      onPress={() => {
        scale.value = withSpring(0.88, { damping: 12, stiffness: 220 }, () => {
          scale.value = withSpring(1);
        });
        onPress();
      }}
      hitSlop={8}>
      <Animated.View
        style={[
          styles.circle,
          animatedStyle,
          { borderColor, backgroundColor },
        ]}>
        {checked ? (
          <Animated.View entering={ZoomIn.springify().damping(14)}>
            <UiIcon name="checkmark" color="#0B0D10" size={18} />
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
