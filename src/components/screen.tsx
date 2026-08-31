import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBg } from '@/components/ambient-bg';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ children, scroll = true, padded = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, Spacing.three);
  const contentStyle = [
    styles.content,
    padded && styles.padded,
    { paddingTop, paddingBottom: Spacing.six },
  ];

  if (!scroll) {
    return (
      <ThemedView style={styles.flex}>
        <AmbientBg />
        <View style={[styles.flex, contentStyle]}>{children}</View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <AmbientBg />
      <ScrollView
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: Spacing.four,
  },
});
