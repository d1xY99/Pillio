import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { formatSet } from '@/constants/gym';
import { Radius, Spacing } from '@/constants/theme';
import type { WorkoutSet } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

export function SetLogger({
  lastSets,
  workingWeightKg,
  currentSets,
  onAdd,
  onDelete,
}: {
  lastSets: WorkoutSet[];
  workingWeightKg: number | null;
  currentSets: WorkoutSet[];
  onAdd: (input: { weightKg: number; reps: number }) => void;
  onDelete: (id: string) => void;
}) {
  const theme = useTheme();
  const [weight, setWeight] = useState(
    workingWeightKg !== null ? String(workingWeightKg) : lastSets[0] ? String(lastSets[0].weightKg) : '',
  );
  const [reps, setReps] = useState(lastSets[0] ? String(lastSets[0].reps) : '5');
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={styles.block}>
      {lastSets.length > 0 ? (
        <ThemedText type="caption" themeColor="textTertiary">
          Last time: {lastSets.map((set) => formatSet(set.weightKg, set.reps)).join('  ·  ')}
        </ThemedText>
      ) : (
        <ThemedText type="caption" themeColor="textTertiary">
          No previous working weight
        </ThemedText>
      )}

      {currentSets.map((set) => (
        <View key={set.id} style={[styles.setRow, { borderColor: theme.border }]}>
          <ThemedText type="body">
            {set.setIndex}. {formatSet(set.weightKg, set.reps)}
          </ThemedText>
          <Pressable onPress={() => onDelete(set.id)}>
            <ThemedText type="captionBold" themeColor="danger">
              Remove
            </ThemedText>
          </Pressable>
        </View>
      ))}

      <View style={styles.inputs}>
        <View style={styles.flex}>
          <TextField
            label="Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.flex}>
          <TextField label="Reps" value={reps} onChangeText={setReps} keyboardType="number-pad" />
        </View>
      </View>
      {error ? (
        <ThemedText type="caption" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      <Button
        label="Add set"
        onPress={() => {
          const weightKg = Number(weight);
          const repsValue = Number(reps);
          if (!Number.isFinite(weightKg) || weightKg < 0 || !Number.isFinite(repsValue) || repsValue <= 0) {
            setError('Enter weight and reps.');
            return;
          }
          setError(null);
          onAdd({ weightKg, reps: Math.round(repsValue) });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.two,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
