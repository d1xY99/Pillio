import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChoiceChipsProps<T extends string> = {
  options: readonly T[];
  value: T;
  labels: Record<T, string>;
  onChange: (value: T) => void;
};

export function ChoiceChips<T extends string>({
  options,
  value,
  labels,
  onChange,
}: ChoiceChipsProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.accentMuted : theme.surface,
                borderColor: selected ? theme.accent : theme.border,
              },
            ]}>
            <ThemedText
              type="captionBold"
              style={{ color: selected ? theme.accent : theme.textSecondary }}>
              {labels[option]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
