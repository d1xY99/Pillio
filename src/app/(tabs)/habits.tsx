import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { GlassCard } from '@/components/glass-card';
import { HabitRow } from '@/components/habit-row';
import { MenuButton } from '@/components/menu-button';
import { PulseRing } from '@/components/pulse-ring';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { UiIcon } from '@/components/ui-icon';
import { Radius, Spacing } from '@/constants/theme';
import { listHabits } from '@/db/queries/habits';
import { ensureHabitLogs, listTodayHabits, overallHabitStreak, toggleTodayHabit } from '@/domain/habits';
import { useCloudSlice } from '@/hooks/use-cloud-slice';
import { useTheme } from '@/hooks/use-theme';

export default function HabitsScreen() {
  useCloudSlice('habits');
  const router = useRouter();
  const theme = useTheme();
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      ensureHabitLogs(1);
      setTick((value) => value + 1);
    }, []),
  );

  const today = useMemo(() => listTodayHabits(), [tick]);
  const archivedOff = listHabits(false);
  const done = today.filter((row) => row.complete).length;
  const total = today.length;
  const streak = useMemo(() => overallHabitStreak(), [tick]);

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

      <FadeIn>
        <GlassCard glow={total > 0 && done < total} padded={false} style={styles.hero}>
          <PulseRing color={theme.accent} active={total > 0 && done < total}>
            <View
              style={[
                styles.ring,
                { borderColor: total > 0 && done === total ? theme.accent : theme.border },
              ]}>
              <ThemedText type="headline">{done}</ThemedText>
              <ThemedText type="caption" themeColor="textTertiary">
                of {total}
              </ThemedText>
            </View>
          </PulseRing>
          <View style={styles.heroCopy}>
            <ThemedText type="headline">
              {total === 0
                ? 'Start a habit'
                : done === total
                  ? 'All checked'
                  : `${total - done} still open`}
            </ThemedText>
            <ThemedText type="callout" themeColor="textSecondary">
              {streak > 0 ? `${streak}-day full streak` : 'Check off like Today — only what is due.'}
            </ThemedText>
          </View>
        </GlassCard>
      </FadeIn>

      {today.length === 0 ? (
        <FadeIn delay={120}>
          <EmptyState
            icon="checkmark.circle"
            title={archivedOff.length ? 'Nothing due today' : 'No habits yet'}
            body={
              archivedOff.length
                ? 'Nothing lands on this weekday. Add one that runs today.'
                : 'Water, walk, journal, stretch — pick a ritual and check it off.'
            }
          />
        </FadeIn>
      ) : (
        <View style={styles.list}>
          {today.map((item, index) => (
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
});
