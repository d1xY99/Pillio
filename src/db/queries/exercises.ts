import { eq } from 'drizzle-orm';

import { apiPost } from '@/api/client';
import { getDb } from '@/db/client';
import { createId } from '@/db/ids';
import { exercises, type Exercise } from '@/db/schema';
import type { MuscleGroup } from '@/db/types';

export function listExercises(options: { archived?: boolean } = {}): Exercise[] {
  const archived = options.archived ?? false;
  return getDb()
    .select()
    .from(exercises)
    .where(eq(exercises.archived, archived))
    .orderBy(exercises.name)
    .all();
}

export function getExercise(id: string): Exercise | undefined {
  return getDb().select().from(exercises).where(eq(exercises.id, id)).get();
}

export function createExercise(input: { name: string; muscleGroup: MuscleGroup }): Exercise {
  const id = createId();
  getDb()
    .insert(exercises)
    .values({
      id,
      name: input.name.trim(),
      muscleGroup: input.muscleGroup,
      archived: false,
      isPreset: false,
    })
    .run();
  void apiPost('/train/exercises', { id, name: input.name.trim(), muscleGroup: input.muscleGroup }).catch(
    () => undefined,
  );
  return getExercise(id)!;
}

export function setExerciseArchived(id: string, archived: boolean): void {
  getDb().update(exercises).set({ archived }).where(eq(exercises.id, id)).run();
}
