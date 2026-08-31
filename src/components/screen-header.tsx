import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        {subtitle ? (
          <ThemedText type="captionBold" themeColor="accent" style={styles.kicker}>
            {subtitle.toUpperCase()}
          </ThemedText>
        ) : null}
        <ThemedText type="display">{title}</ThemedText>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  titles: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    letterSpacing: 1.8,
    fontSize: 11,
  },
  right: {
    paddingTop: Spacing.one,
  },
});
