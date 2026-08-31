import type { MuscleGroup } from '@/db/types';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  core: 'Core',
  full_body: 'Full body',
};

export function formatKg(weight: number): string {
  const rounded = Number.isInteger(weight)
    ? weight.toString()
    : weight.toFixed(1).replace(/\.0$/, '');
  return `${rounded} kg`;
}

export function formatSet(weightKg: number, reps: number): string {
  return `${formatKg(weightKg)} × ${reps}`;
}
