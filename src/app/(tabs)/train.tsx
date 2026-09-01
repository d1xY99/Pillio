import { desc } from 'drizzle-orm';
import { useLiveQuery } from '@/db/live';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { FadeIn } from '@/components/fade-in';
import { HeroBanner } from '@/components/hero-banner';
import { Screen } from '@/components/screen';
import { MenuButton } from '@/components/menu-button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ART } from '@/constants/art';
import { formatKg } from '@/constants/gym';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { listExercises } from '@/db/queries/exercises';
import {
  getOpenWorkoutSession,
  getWorkingWeightKg,
  listSetsForSession,
  listWorkoutSessions,
  startWorkoutSession,
} from '@/db/queries/workouts';
import { workoutSessions } from '@/db/schema';
import { formatDayLabel } from '@/domain/time';
import { useCloudSlice } from '@/hooks/use-cloud-slice';
import { useTheme } from '@/hooks/use-theme';

export default function TrainScreen() {
  useCloudSlice('gym');
  const router = useRouter();
  const theme = useTheme();
  const db = getDb();
  const { updatedAt } = useLiveQuery(
    db.select().from(workoutSessions).orderBy(desc(workoutSessions.startedAt)),
  );

  const open = useMemo(() => getOpenWorkoutSession(), [updatedAt]);
  const sessions = useMemo(() => listWorkoutSessions(12), [updatedAt]);
  const exercises = useMemo(() => listExercises(), [updatedAt]);
  const lifts = useMemo(
    () =>
      exercises
        .map((exercise) => ({
          exercise,
          weight: getWorkingWeightKg(exercise.id),
        }))
        .filter((row) => row.weight !== null)
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)),
    [exercises, updatedAt],
  );

  function startOrResume() {
    const session = open ?? startWorkoutSession();
    router.push({ pathname: '/workout/[id]', params: { id: session.id } });
  }

  return (
    <Screen>
      <ScreenHeader title="Train" subtitle="Working weights and sessions" right={<MenuButton />} />

      <HeroBanner
        source={ART.train}
        kicker="STRENGTH"
        title={open ? 'Session in progress.' : 'Load the bar.'}
        body="Every set remembers the last weight you moved."
      />

      <FadeIn delay={80}>
        <View style={styles.cta}>
          <Button label={open ? 'Resume workout' : 'Start workout'} onPress={startOrResume} />
        </View>
      </FadeIn>

      {lifts.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="captionBold" themeColor="textTertiary">
            WORKING WEIGHTS
          </ThemedText>
          {lifts.slice(0, 8).map((row) => (
            <Pressable
              key={row.exercise.id}
              onPress={() =>
                router.push({ pathname: '/exercise/[id]', params: { id: row.exercise.id } })
              }
              style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText type="body">{row.exercise.name}</ThemedText>
              <ThemedText type="headline">{formatKg(row.weight ?? 0)}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState
          icon="dumbbell.fill"
          title="No workouts yet"
          body="Log sets with weight and reps. Each exercise remembers the last load you used."
        />
      ) : (
        <View style={styles.section}>
          <ThemedText type="captionBold" themeColor="textTertiary">
            RECENT SESSIONS
          </ThemedText>
          {sessions.map((session) => {
            const sets = listSetsForSession(session.id);
            const exerciseCount = new Set(sets.map((set) => set.exerciseId)).size;
            return (
              <Pressable
                key={session.id}
                onPress={() => router.push({ pathname: '/workout/[id]', params: { id: session.id } })}
                style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View>
                  <ThemedText type="body">{formatDayLabel(session.startedAt)}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {exerciseCount} exercises · {sets.length} sets
                    {session.finishedAt ? '' : ' · In progress'}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginBottom: Spacing.four,
  },
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  row: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
