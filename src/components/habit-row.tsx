import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { CheckButton } from '@/components/check-button';
import { PressScale } from '@/components/press-scale';
import { ThemedText } from '@/components/themed-text';
import { HABIT_CATEGORIES } from '@/constants/habits';
import { Radius, Spacing } from '@/constants/theme';
import type { TodayHabit } from '@/domain/habits';
import { habitStreak } from '@/domain/habits';
import { useTheme } from '@/hooks/use-theme';

export function HabitRow({
  item,
  index,
  onToggle,
  onPress,
}: {
  item: TodayHabit;
  index: number;
  onToggle: () => void;
  onPress: () => void;
}) {
  const theme = useTheme();
  const category = HABIT_CATEGORIES.find((row) => row.id === item.habit.category)?.label ?? item.habit.category;
  const streak = habitStreak(item.habit.id);

  return (
    <Animated.View entering={FadeInRight.delay(60 + index * 50).springify().damping(16)}>
      <PressScale onPress={onPress}>
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.surface,
              borderColor: item.complete ? `${item.habit.color}66` : theme.border,
              opacity: item.complete ? 0.72 : 1,
            },
          ]}>
          <View style={[styles.stripe, { backgroundColor: item.habit.color }]} />
          <View style={[styles.emojiWrap, { backgroundColor: `${item.habit.color}22` }]}>
            <Text style={styles.emoji}>{item.habit.emoji}</Text>
          </View>
          <View style={styles.body}>
            <ThemedText type="headline" numberOfLines={1}>
              {item.habit.name}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {category}
              {item.total > 1 ? ` · ${item.done}/${item.total}` : ''}
              {streak > 0 ? ` · ${streak}d streak` : ''}
            </ThemedText>
            {item.total > 1 ? (
              <View style={styles.dots}>
                {item.logs.map((log) => (
                  <View
                    key={log.id}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: log.takenAt ? item.habit.color : theme.border,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
          <CheckButton checked={item.complete} onPress={onToggle} />
        </View>
      </PressScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 84,
    paddingRight: Spacing.three,
    gap: Spacing.two,
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  emoji: {
    fontSize: 24,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
