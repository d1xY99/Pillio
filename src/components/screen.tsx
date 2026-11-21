import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBg } from '@/components/ambient-bg';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAdaptiveLayout } from '@/hooks/use-adaptive-layout';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Screen lays out <Columns>; drop the max width when two panes are shown. */
  columns?: boolean;
};

export function Screen({ children, scroll = true, padded = true, columns = false }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { rail, twoPane } = useAdaptiveLayout();
  const paddingTop = Math.max(insets.top, Spacing.three);
  // The floating bottom tab bar needs ~88pt of clearance; the side rail needs none.
  const bottomChrome = rail ? Spacing.four : 88;
  const contentStyle = [
    styles.content,
    padded && styles.padded,
    columns && twoPane && styles.fullWidth,
    { paddingTop, paddingBottom: Math.max(insets.bottom, 24) + bottomChrome },
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
  fullWidth: {
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
});
