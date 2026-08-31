import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { SetLogger } from '@/components/set-logger';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { getExercise } from '@/db/queries/exercises';
import {
  addWorkoutSet,
  deleteWorkoutSet,
  finishWorkoutSession,
  getLastSessionSetsForExercise,
  getWorkingWeightKg,
  getWorkoutSession,
  listSetsForSession,
} from '@/db/queries/workouts';
import { workoutSets } from '@/db/schema';
import { formatDayLabel } from '@/domain/time';
import { useDraftExercises } from '@/domain/workout-draft';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const db = getDb();
  const session = id ? getWorkoutSession(id) : undefined;
  const { updatedAt } = useLiveQuery(
    db.select().from(workoutSets).where(eq(workoutSets.sessionId, id ?? '')),
    [id],
  );
  const extraIds = useDraftExercises(id ?? '');

  useEffect(() => {
    navigation.setOptions({
      title: session ? formatDayLabel(session.startedAt) : 'Workout',
    });
  }, [navigation, session]);

  const sets = useMemo(() => (id ? listSetsForSession(id) : []), [id, updatedAt]);
  const exerciseIds = useMemo(() => {
    const fromSets = [...new Set(sets.map((set) => set.exerciseId))];
    return [...new Set([...fromSets, ...extraIds])];
  }, [sets, extraIds]);

  if (!session) {
    return (
      <Screen>
        <ThemedText type="headline">Workout not found</ThemedText>
      </Screen>
    );
  }

  const finished = Boolean(session.finishedAt);

  return (
    <Screen>
      {exerciseIds.length === 0 ? (
        <ThemedText type="callout" themeColor="textSecondary">
          Add an exercise to start logging sets. Last session weights show up as a reference.
        </ThemedText>
      ) : null}

      {exerciseIds.map((exerciseId) => {
        const exercise = getExercise(exerciseId);
        if (!exercise) return null;
        const currentSets = sets.filter((set) => set.exerciseId === exerciseId);
        return (
          <View
            key={exerciseId}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText
              type="headline"
              onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: exerciseId } })}>
              {exercise.name}
            </ThemedText>
            {finished ? (
              currentSets.map((set) => (
                <ThemedText key={set.id} type="callout" themeColor="textSecondary">
                  {set.setIndex}. {set.weightKg} kg × {set.reps}
                </ThemedText>
              ))
            ) : (
              <SetLogger
                lastSets={getLastSessionSetsForExercise(exerciseId)}
                workingWeightKg={getWorkingWeightKg(exerciseId)}
                currentSets={currentSets}
                onAdd={({ weightKg, reps }) => {
                  addWorkoutSet({ sessionId: session.id, exerciseId, reps, weightKg });
                }}
                onDelete={deleteWorkoutSet}
              />
            )}
          </View>
        );
      })}

      {!finished ? (
        <View style={styles.actions}>
          <Button
            label="Add exercise"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/exercise/picker',
                params: { sessionId: session.id },
              })
            }
          />
          <Button
            label="Finish workout"
            onPress={() => {
              if (sets.length === 0) {
                Alert.alert('No sets yet', 'Log at least one set before finishing.');
                return;
              }
              finishWorkoutSession(session.id);
              router.back();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.five,
  },
});
