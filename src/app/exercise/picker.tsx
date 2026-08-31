import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { MUSCLE_LABELS } from '@/constants/gym';
import { Radius, Spacing } from '@/constants/theme';
import { createExercise, listExercises } from '@/db/queries/exercises';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/db/types';
import { addDraftExercise } from '@/domain/workout-draft';
import { useTheme } from '@/hooks/use-theme';

export default function ExercisePickerScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup>('full_body');
  const [tick, setTick] = useState(0);
  const exercises = useMemo(() => listExercises(), [tick]);
  const filtered = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function pick(id: string) {
    if (!sessionId) return;
    addDraftExercise(sessionId, id);
    router.back();
  }

  return (
    <Screen>
      <TextField label="Search" value={query} onChangeText={setQuery} placeholder="Bench, squat..." />

      <View style={styles.list}>
        {filtered.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => pick(exercise.id)}
            style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ThemedText type="body">{exercise.name}</ThemedText>
            <ThemedText type="caption" themeColor="textTertiary">
              {MUSCLE_LABELS[exercise.muscleGroup as MuscleGroup]}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={[styles.create, { borderColor: theme.border }]}>
        <ThemedText type="headline">New exercise</ThemedText>
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Incline press" />
        <ChoiceChips
          options={MUSCLE_GROUPS}
          value={muscle}
          labels={MUSCLE_LABELS}
          onChange={setMuscle}
        />
        <Button
          label="Create and add"
          variant="secondary"
          onPress={() => {
            if (!name.trim()) return;
            const created = createExercise({ name: name.trim(), muscleGroup: muscle });
            setTick((value) => value + 1);
            pick(created.id);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
    marginTop: Spacing.three,
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
  create: {
    gap: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
});
