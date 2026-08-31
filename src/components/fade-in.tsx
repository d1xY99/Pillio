import { type ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: object;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(520).springify().damping(18)}
      style={style}>
      {children}
    </Animated.View>
  );
}
