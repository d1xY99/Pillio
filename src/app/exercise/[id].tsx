import { useLiveQuery } from '@/db/live';
import { eq } from 'drizzle-orm';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { formatKg, formatSet, MUSCLE_LABELS } from '@/constants/gym';
import { Radius, Spacing } from '@/constants/theme';
import { getDb } from '@/db/client';
import { getExercise } from '@/db/queries/exercises';
import {
  getExerciseHistory,
  getLastSessionSetsForExercise,
  getWorkingWeightKg,
} from '@/db/queries/workouts';
import { workoutSets } from '@/db/schema';
import type { MuscleGroup } from '@/db/types';
import { formatDayLabel } from '@/domain/time';
import { useTheme } from '@/hooks/use-theme';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const db = getDb();
  const { updatedAt } = useLiveQuery(
    db.select().from(workoutSets).where(eq(workoutSets.exerciseId, id ?? '')),
    [id],
  );
  const exercise = id ? getExercise(id) : undefined;
  const working = exercise ? getWorkingWeightKg(exercise.id) : null;
  const lastSets = exercise ? getLastSessionSetsForExercise(exercise.id) : [];
  const history = useMemo(
    () => (exercise ? getExerciseHistory(exercise.id) : []),
    [exercise, updatedAt],
  );

  useEffect(() => {
    navigation.setOptions({ title: exercise?.name ?? 'Exercise' });
  }, [exercise?.name, navigation]);

  if (!exercise) {
    return (
      <Screen>
        <ThemedText type="headline">Exercise not found</ThemedText>
      </Screen>
    );
  }

  const chartData = history.map((point) => ({ value: point.weightKg }));

  return (
    <Screen>
      <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="captionBold" themeColor="textTertiary">
          {MUSCLE_LABELS[exercise.muscleGroup as MuscleGroup].toUpperCase()}
        </ThemedText>
        <ThemedText type="display">{working !== null ? formatKg(working) : '—'}</ThemedText>
        <ThemedText type="callout" themeColor="textSecondary">
          Current working weight
        </ThemedText>
      </View>

      {lastSets.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="captionBold" themeColor="textTertiary">
            LAST SESSION
          </ThemedText>
          <ThemedText type="body">
            {lastSets.map((set) => formatSet(set.weightKg, set.reps)).join('  ·  ')}
          </ThemedText>
        </View>
      ) : null}

      {chartData.length >= 2 ? (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="captionBold" themeColor="textTertiary">
            TOP SET
          </ThemedText>
          <LineChart
            data={chartData}
            width={Math.max(220, width - 80)}
            height={160}
            color={theme.accent}
            thickness={3}
            hideRules
            hideYAxisText={false}
            yAxisColor={theme.border}
            xAxisColor={theme.border}
            yAxisTextStyle={{ color: theme.textTertiary, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: theme.textTertiary, fontSize: 10 }}
            dataPointsColor={theme.accent}
            backgroundColor="transparent"
            isAnimated={false}
            adjustToWidth
          />
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="captionBold" themeColor="textTertiary">
          HISTORY
        </ThemedText>
        {history.length === 0 ? (
          <ThemedText type="callout" themeColor="textSecondary">
            Finish a workout with this exercise to see history.
          </ThemedText>
        ) : (
          history
            .slice()
            .reverse()
            .map((point) => (
              <View key={point.startedAt} style={styles.historyRow}>
                <ThemedText type="callout">{formatDayLabel(point.startedAt)}</ThemedText>
                <ThemedText type="body">{formatKg(point.weightKg)}</ThemedText>
              </View>
            ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.one,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
