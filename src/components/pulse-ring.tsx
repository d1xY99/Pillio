import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function PulseRing({
  children,
  color,
  active,
}: {
  children: ReactNode;
  color: string;
  active: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [active, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.12 }],
    opacity: 0.18 + pulse.value * 0.28,
  }));

  return (
    <View style={styles.wrap}>
      {active ? (
        <Animated.View style={[styles.glow, { borderColor: color }, glowStyle]} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
  },
});
