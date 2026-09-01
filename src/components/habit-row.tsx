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

  return (
    <Animated.View entering={FadeInRight.delay(50 + index * 45).springify().damping(16)}>
      <PressScale onPress={onPress}>
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
          <View style={styles.row}>
            <View style={styles.thumb}>
              <Image source={habitCategoryArt(item.habit.category)} style={styles.thumbImage} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(6,7,8,0.55)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.emoji}>{item.habit.emoji}</Text>
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <ThemedText type="headline" numberOfLines={1} style={{ flex: 1 }}>
                  {item.habit.name}
                </ThemedText>
                <View style={[styles.badge, { backgroundColor: `${item.habit.color}22` }]}>
                  <ThemedText type="captionBold" style={[styles.badgeText, { color: item.habit.color }]}>
                    {(category?.label ?? item.habit.category).toUpperCase()}
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                {item.total > 1 ? `${item.done}/${item.total} today` : item.complete ? 'Done today' : 'Open today'}
                {streak > 0 ? ` · ${streak}d streak` : ''}
              </ThemedText>
              {item.total > 1 ? (
                <View style={styles.dots}>
                  {item.logs.map((log) => (
                    <View
                      key={log.id}
                      style={[
                        styles.dot,
                        { backgroundColor: log.takenAt ? item.habit.color : theme.border },
                      ]}
                    />
                  ))}
                </View>
              ) : null}
            </View>
            <CheckButton checked={item.complete} onPress={onToggle} />
          </View>
        </View>
      </PressScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 76,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 8,
    paddingRight: Spacing.two,
    paddingLeft: 8,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    ...StyleSheet.absoluteFill,
  },
  emoji: { fontSize: 20 },
  copy: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    letterSpacing: 0.6,
    fontSize: 9,
  },
  dots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
