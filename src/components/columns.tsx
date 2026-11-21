import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAdaptiveLayout } from '@/hooks/use-adaptive-layout';

/**
 * Two columns on the iPhone Duo inner display (landscape) and other wide screens,
 * a single stacked column everywhere else.
 *
 * The gutter is centred on the hinge so nothing sits across the fold. This assumes the
 * columns live inside a padded <Screen columns> that starts at the window's left edge
 * (the tab rail is on the right).
 */
export function Columns({ left, right }: { left: ReactNode; right: ReactNode }) {
  const { twoPane, hinge } = useAdaptiveLayout();

  if (!twoPane || !hinge) {
    return (
      <>
        {left}
        {right}
      </>
    );
  }

  const halfGutter = Math.max((hinge.end - hinge.start) / 2 + Spacing.three, Spacing.four);
  const middle = (hinge.start + hinge.end) / 2;
  const leftWidth = Math.max(260, middle - halfGutter - Spacing.four);

  return (
    <View style={styles.row}>
      <View style={{ width: leftWidth }}>{left}</View>
      <View style={[styles.right, { marginLeft: halfGutter * 2 }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  right: {
    flex: 1,
    minWidth: 0,
  },
});
