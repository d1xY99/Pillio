import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { CheckButton } from '@/components/check-button';
import { PressScale } from '@/components/press-scale';
import { ThemedText } from '@/components/themed-text';
import { HABIT_CATEGORIES, habitCategoryArt } from '@/constants/habits';
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
  const category = HABIT_CATEGORIES.find((row) => row.id === item.habit.category);
  const streak = habitStreak(item.habit.id);
  const status =
    item.total > 1
      ? `${item.done}/${item.total} today`
      : item.complete
        ? 'Done today'
        : 'Open today';

  return (
    <Animated.View entering={FadeInRight.delay(50 + index * 45).springify().damping(16)}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: item.complete ? `${item.habit.color}66` : theme.border,
            opacity: item.complete ? 0.78 : 1,
          },
        ]}>
        <View style={[styles.accent, { backgroundColor: item.habit.color }]} />
        <PressScale onPress={onPress} style={styles.main}>
          <View style={styles.mainInner}>
            <View style={styles.thumb}>
              <Image source={habitCategoryArt(item.habit.category)} style={styles.thumbImage} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(6,7,8,0.55)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.emoji}>{item.habit.emoji}</Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <ThemedText type="headline" numberOfLines={1} style={styles.name}>
                  {item.habit.name}
                </ThemedText>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${item.habit.color}22`, borderColor: `${item.habit.color}66` },
                  ]}>
                  <ThemedText type="captionBold" style={[styles.badgeText, { color: item.habit.color }]}>
                    {(category?.label ?? item.habit.category).toUpperCase()}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="callout" themeColor="textSecondary">
                {status}
                {streak > 0 ? ` · ${streak}d streak` : ''}
              </ThemedText>
              {item.total > 1 ? (
                <View style={styles.dots}>
                  {item.logs.map((log) => (
                    <View
                      key={log.id}
                      style={[styles.dot, { backgroundColor: log.takenAt ? item.habit.color : theme.border }]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </PressScale>
        <View style={styles.check}>
          <CheckButton checked={item.complete} onPress={onToggle} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 88,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
  },
  main: {
    flex: 1,
  },
  mainInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  thumbImage: {
    ...StyleSheet.absoluteFill,
  },
  emoji: { fontSize: 20 },
  copy: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    letterSpacing: 0.8,
    fontSize: 10,
  },
  dots: { flexDirection: 'row', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  check: {
    paddingRight: Spacing.three,
    justifyContent: 'center',
  },
});
