import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dismissToast, subscribeToast, type Toast } from '@/lib/toast';

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => subscribeToast(setToast), []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (toast) {
      timer.current = setTimeout(() => dismissToast(), toast.duration);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + 84 }]}>
      <Animated.View
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(180)}
        style={[styles.toast, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
        <ThemedText type="callout" style={styles.message} numberOfLines={2}>
          {toast.message}
        </ThemedText>
        {toast.action ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              toast.action?.onPress();
              dismissToast();
            }}>
            <ThemedText type="captionBold" themeColor="accent">
              {toast.action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: 520,
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  message: {
    flex: 1,
  },
});
