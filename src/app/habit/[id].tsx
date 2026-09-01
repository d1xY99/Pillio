import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { HABIT_CATEGORIES, habitCategoryArt } from '@/constants/habits';
import { Radius, Spacing } from '@/constants/theme';
import { deleteHabit, getHabit, setHabitArchived } from '@/db/queries/habits';
import { habitStreak } from '@/domain/habits';
import { confirmAction } from '@/lib/confirm';
import { addLocalDays, eachLocalDay, formatTimeMinutes, startOfLocalDay } from '@/domain/time';
import { getDb } from '@/db/client';
import { habitLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useTheme } from '@/hooks/use-theme';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [tick, setTick] = useState(0);
  const habit = getHabit(id);
  const streak = useMemo(() => (habit ? habitStreak(habit.id) : 0), [habit, tick]);

  const heat = useMemo(() => {
    if (!habit) return [];
    const end = startOfLocalDay();
    const start = addLocalDays(end, -27);
    const logs = getDb().select().from(habitLogs).where(eq(habitLogs.habitId, habit.id)).all();
    return eachLocalDay(start, end).map((day) => {
      const rows = logs.filter((log) => log.scheduledFor === day);
      const done = rows.filter((log) => log.takenAt).length;
      const total = Math.max(rows.length, habit.timesPerDay);
      if (rows.length === 0) return { day, fill: 0 };
      return { day, fill: total ? done / total : 0 };
    });
  }, [habit, tick]);

  if (!habit) {
    return (
      <Screen>
        <ThemedText type="headline">Habit not found</ThemedText>
      </Screen>
    );
  }

  const category = HABIT_CATEGORIES.find((row) => row.id === habit.category)?.label ?? habit.category;

  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={habitCategoryArt(habit.category)} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={['rgba(6,7,8,0.2)', 'rgba(6,7,8,0.88)']} style={StyleSheet.absoluteFill} />
        <View style={[styles.emoji, { backgroundColor: `${habit.color}33` }]}>
          <Text style={{ fontSize: 36 }}>{habit.emoji}</Text>
        </View>
        <ThemedText type="title" style={{ color: '#F6FAF8' }}>
          {habit.name}
        </ThemedText>
        <ThemedText type="callout" style={{ color: 'rgba(244,247,245,0.75)' }}>
          {category} · {habit.frequency === 'daily' ? 'Every day' : habit.frequency === 'weekdays' ? 'Weekdays' : 'Selected days'}
          {habit.timesPerDay > 1 ? ` · ${habit.timesPerDay}× / day` : ''}
        </ThemedText>
        <ThemedText type="headline" style={{ color: habit.color }}>
          {streak}-day streak
        </ThemedText>
        <ThemedText type="callout" style={{ color: 'rgba(244,247,245,0.75)' }}>
          {habit.reminderEnabled === false
            ? 'No reminder'
            : `Reminder · ${formatTimeMinutes(habit.reminderMinutes ?? 9 * 60)}`}
        </ThemedText>
      </View>

      <ThemedText type="captionBold" themeColor="textSecondary">
        Last 28 days
      </ThemedText>
      <View style={styles.heat}>
        {heat.map((cell) => (
          <View
            key={cell.day}
            style={[
              styles.cell,
              {
                backgroundColor: cell.fill === 0 ? theme.surfaceRaised : habit.color,
                opacity: cell.fill === 0 ? 1 : 0.25 + cell.fill * 0.75,
              },
            ]}
          />
        ))}
      </View>

      {habit.notes ? (
        <ThemedText type="callout" themeColor="textSecondary">
          {habit.notes}
        </ThemedText>
      ) : null}

      <Button label="Edit" variant="secondary" onPress={() => router.push({ pathname: '/habit/form', params: { id: habit.id } })} />
      <Button
        label={habit.archived ? 'Restore' : 'Archive'}
        variant="secondary"
        onPress={() => {
          setHabitArchived(habit.id, !habit.archived);
          setTick((value) => value + 1);
          router.back();
        }}
      />
      <Pressable
        onPress={() => {
          void confirmAction(`Delete ${habit.name}?`, 'This removes the habit and its history.', 'Delete').then((ok) => {
            if (!ok) return;
            deleteHabit(habit.id);
            router.back();
          });
        }}>
        <ThemedText type="callout" themeColor="danger" style={{ textAlign: 'center' }}>
          Delete
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    padding: Spacing.four,
    marginBottom: Spacing.four,
    minHeight: 220,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heat: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.four,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
});
