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
              borderColor: item.complete ? `${item.habit.color}88` : theme.border,
            },
          ]}>
          <Image source={habitCategoryArt(item.habit.category)} style={styles.image} contentFit="cover" />
          <LinearGradient
            colors={['rgba(6,7,8,0.15)', 'rgba(6,7,8,0.88)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.accent, { backgroundColor: item.habit.color }]} />
          <View style={styles.top}>
            <View style={styles.emojiWrap}>
              <Text style={styles.emoji}>{item.habit.emoji}</Text>
            </View>
            <View style={styles.badge}>
              <ThemedText type="captionBold" style={styles.badgeText}>
                {(category?.label ?? item.habit.category).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <View style={styles.bottom}>
            <View style={styles.copy}>
              <ThemedText type="headline" style={styles.name} numberOfLines={1}>
                {item.habit.name}
              </ThemedText>
              <ThemedText type="caption" style={styles.meta}>
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
                        { backgroundColor: log.takenAt ? item.habit.color : 'rgba(255,255,255,0.28)' },
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
    height: 148,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  image: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 1.06 }],
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(8,10,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(8,10,12,0.55)',
  },
  badgeText: {
    color: 'rgba(246,250,248,0.82)',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  copy: { flex: 1, gap: 4 },
  name: { color: '#F6FAF8' },
  meta: { color: 'rgba(244,247,245,0.72)' },
  dots: { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
