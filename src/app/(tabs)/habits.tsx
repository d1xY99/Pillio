import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { HabitRow } from '@/components/habit-row';
import { HeroBanner } from '@/components/hero-banner';
import { MenuButton } from '@/components/menu-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { ART } from '@/constants/art';
import { HABIT_CATEGORIES, habitCategoryArt } from '@/constants/habits';
import { Radius, Spacing } from '@/constants/theme';
import { subscribeDb } from '@/db/events';
import { listHabits } from '@/db/queries/habits';
import { ensureHabitLogs, listTodayHabits, overallHabitStreak, toggleTodayHabit } from '@/domain/habits';
import { useCloudSlice } from '@/hooks/use-cloud-slice';
import { useTheme } from '@/hooks/use-theme';

export default function HabitsScreen() {
  useCloudSlice('habits');
  const router = useRouter();
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      ensureHabitLogs(1);
      setTick((value) => value + 1);
    }, []),
  );

  useEffect(
    () =>
      subscribeDb(() => {
        setTick((value) => value + 1);
      }),
    [],
  );

  const today = useMemo(() => listTodayHabits(), [tick]);
  const filtered = filter === 'all' ? today : today.filter((row) => row.habit.category === filter);
  const archivedOff = listHabits(false);
  const done = today.filter((row) => row.complete).length;
  const total = today.length;
  const streak = useMemo(() => overallHabitStreak(), [tick]);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of today) map[row.habit.category] = (map[row.habit.category] ?? 0) + 1;
    return map;
  }, [today]);

  return (
    <Screen>
      <ScreenHeader
        title="Habits"
        subtitle="Daily actions"
        right={
          <View style={styles.headerActions}>
            <MenuButton />
            <Pressable
              onPress={() => router.push('/habit/form')}
              style={[styles.add, { backgroundColor: theme.accent }]}
              accessibilityLabel="Add habit">
              <UiIcon name="plus" color="#06110D" size={14} />
            </Pressable>
          </View>
        }
      />

      <HeroBanner
        kicker="RITUAL"
        title={
          total === 0
            ? 'Build the day'
            : done === total
              ? 'All checked'
              : `${total - done} still open`
        }
        source={ART.habitHero}
      />

      <View style={styles.stats}>
        <View style={[styles.stat, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <ThemedText type="title">{done}</ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            done
          </ThemedText>
        </View>
        <View style={[styles.stat, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <ThemedText type="title">{total}</ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            due
          </ThemedText>
        </View>
        <View style={[styles.stat, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <ThemedText type="title">{streak}</ThemedText>
          <ThemedText type="caption" themeColor="textTertiary">
            streak
          </ThemedText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
        <CategoryChip
          label="All"
          selected={filter === 'all'}
          source={ART.habitHero}
          count={today.length}
          onPress={() => setFilter('all')}
        />
        {HABIT_CATEGORIES.map((cat, index) => (
          <CategoryChip
            key={cat.id}
            label={cat.label}
            selected={filter === cat.id}
            source={habitCategoryArt(cat.id)}
            count={counts[cat.id] ?? 0}
            delay={40 + index * 40}
            onPress={() => setFilter(cat.id)}
          />
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <FadeIn delay={80}>
          <EmptyState
            icon="checkmark.circle"
            title={archivedOff.length ? 'Nothing in this lane' : 'No habits yet'}
            body={
              archivedOff.length
                ? 'Try another category, or add a ritual for today.'
                : 'Pick a category, give it a name, check it off like Today.'
            }
          />
        </FadeIn>
      ) : (
        <View style={styles.list}>
          {filtered.map((item, index) => (
            <HabitRow
              key={item.habit.id}
              item={item}
              index={index}
              onPress={() => router.push({ pathname: '/habit/[id]', params: { id: item.habit.id } })}
              onToggle={() => {
                toggleTodayHabit(item);
                setTick((value) => value + 1);
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function CategoryChip({
  label,
  source,
  selected,
  count,
  onPress,
  delay = 0,
}: {
  label: string;
  source: typeof ART.habitHero;
  selected: boolean;
  count: number;
  onPress: () => void;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)}>
      <Pressable
        onPress={onPress}
        style={[styles.chip, selected && styles.chipOn]}>
        <Image source={source} style={styles.chipImage} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(6,7,8,0.92)']} style={StyleSheet.absoluteFill} />
        <ThemedText type="captionBold" style={styles.chipLabel}>
          {label}
        </ThemedText>
        <ThemedText type="caption" style={styles.chipCount}>
          {count}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  add: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  stat: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  cats: {
    gap: 10,
    paddingBottom: Spacing.three,
    paddingRight: Spacing.two,
  },
  chip: {
    width: 108,
    height: 86,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 8,
  },
  chipOn: {
    borderColor: '#3EE0B7',
  },
  chipImage: {
    ...StyleSheet.absoluteFill,
  },
  chipLabel: {
    color: '#F6FAF8',
  },
  chipCount: {
    color: 'rgba(244,247,245,0.7)',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
});
