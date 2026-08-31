import { count } from 'drizzle-orm';

import { exercises } from '@/db/schema';
import type { MuscleGroup } from '@/db/types';

const PRESET_EXERCISES: { id: string; name: string; muscleGroup: MuscleGroup }[] = [
  { id: 'ex_squat', name: 'Squat', muscleGroup: 'legs' },
  { id: 'ex_bench', name: 'Bench Press', muscleGroup: 'chest' },
  { id: 'ex_deadlift', name: 'Deadlift', muscleGroup: 'back' },
  { id: 'ex_ohp', name: 'Overhead Press', muscleGroup: 'shoulders' },
  { id: 'ex_row', name: 'Barbell Row', muscleGroup: 'back' },
  { id: 'ex_pullup', name: 'Pull-Up', muscleGroup: 'back' },
  { id: 'ex_rdl', name: 'Romanian Deadlift', muscleGroup: 'legs' },
  { id: 'ex_lunge', name: 'Lunge', muscleGroup: 'legs' },
  { id: 'ex_pulldown', name: 'Lat Pulldown', muscleGroup: 'back' },
  { id: 'ex_cable_row', name: 'Cable Row', muscleGroup: 'back' },
  { id: 'ex_curl', name: 'Bicep Curl', muscleGroup: 'arms' },
  { id: 'ex_extension', name: 'Tricep Extension', muscleGroup: 'arms' },
  { id: 'ex_lateral', name: 'Lateral Raise', muscleGroup: 'shoulders' },
  { id: 'ex_hip_thrust', name: 'Hip Thrust', muscleGroup: 'legs' },
  { id: 'ex_calf', name: 'Calf Raise', muscleGroup: 'legs' },
  { id: 'ex_plank', name: 'Plank', muscleGroup: 'core' },
];

export function seedExercises(db: any) {
  const [row] = db.select({ value: count() }).from(exercises).all();
  if ((row?.value ?? 0) > 0) return;

  db.insert(exercises)
    .values(
      PRESET_EXERCISES.map((exercise) => ({
        ...exercise,
        archived: false,
        isPreset: true,
      })),
    )
    .run();
}
