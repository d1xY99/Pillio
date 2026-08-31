import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';

import { apiDelete, apiPatch, apiPost } from '@/api/client';
import { getDb } from '@/db/client';
import { createId } from '@/db/ids';
import {
  workoutSessions,
  workoutSets,
  type WorkoutSession,
  type WorkoutSet,
} from '@/db/schema';

export function listWorkoutSessions(limit = 40): WorkoutSession[] {
  return getDb()
    .select()
    .from(workoutSessions)
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit)
    .all();
}

export function getWorkoutSession(id: string): WorkoutSession | undefined {
  return getDb().select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
}

export function getOpenWorkoutSession(): WorkoutSession | undefined {
  return getDb()
    .select()
    .from(workoutSessions)
    .where(isNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.startedAt))
    .get();
}

export function startWorkoutSession(): WorkoutSession {
  const open = getOpenWorkoutSession();
  if (open) return open;

  const id = createId();
  getDb()
    .insert(workoutSessions)
    .values({ id, startedAt: Date.now(), finishedAt: null, notes: null })
    .run();
  void apiPost('/train/sessions', { id, startedAt: Date.now() }).catch(() => undefined);
  return getWorkoutSession(id)!;
}

export function finishWorkoutSession(id: string, notes?: string | null): WorkoutSession {
  getDb()
    .update(workoutSessions)
    .set({ finishedAt: Date.now(), notes: notes ?? null })
    .where(eq(workoutSessions.id, id))
    .run();
  void apiPost(`/train/sessions/${id}/finish`, { notes: notes ?? null }).catch(() => undefined);
  return getWorkoutSession(id)!;
}

export function listSetsForSession(sessionId: string): WorkoutSet[] {
  return getDb()
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.sessionId, sessionId))
    .orderBy(workoutSets.setIndex)
    .all();
}

export function listSetsForExercise(exerciseId: string, limit = 80): WorkoutSet[] {
  return getDb()
    .select()
    .from(workoutSets)
    .where(and(eq(workoutSets.exerciseId, exerciseId), eq(workoutSets.completed, true)))
    .orderBy(desc(workoutSets.id))
    .limit(limit)
    .all();
}

export function getLastSessionSetsForExercise(exerciseId: string): WorkoutSet[] {
  const last = getDb()
    .select({
      sessionId: workoutSets.sessionId,
      startedAt: workoutSessions.startedAt,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.completed, true),
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .orderBy(desc(workoutSessions.startedAt))
    .get();

  if (!last) return [];

  return getDb()
    .select()
    .from(workoutSets)
    .where(and(eq(workoutSets.sessionId, last.sessionId), eq(workoutSets.exerciseId, exerciseId)))
    .orderBy(workoutSets.setIndex)
    .all();
}

export function getWorkingWeightKg(exerciseId: string): number | null {
  const lastSets = getLastSessionSetsForExercise(exerciseId);
  if (lastSets.length === 0) return null;
  return Math.max(...lastSets.map((set) => set.weightKg));
}

export function addWorkoutSet(input: {
  sessionId: string;
  exerciseId: string;
  reps: number;
  weightKg: number;
}): WorkoutSet {
  const existing = listSetsForSession(input.sessionId).filter(
    (set) => set.exerciseId === input.exerciseId,
  );
  const id = createId();
  getDb()
    .insert(workoutSets)
    .values({
      id,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      setIndex: existing.length + 1,
      reps: input.reps,
      weightKg: input.weightKg,
      completed: true,
    })
    .run();

  void apiPost(`/train/sessions/${input.sessionId}/sets`, {
    id,
    exerciseId: input.exerciseId,
    reps: input.reps,
    weightKg: input.weightKg,
  }).catch(() => undefined);

  return getDb().select().from(workoutSets).where(eq(workoutSets.id, id)).get()!;
}

export function updateWorkoutSet(
  id: string,
  patch: { reps?: number; weightKg?: number; completed?: boolean },
): WorkoutSet {
  getDb().update(workoutSets).set(patch).where(eq(workoutSets.id, id)).run();
  void apiPatch(`/train/sets/${id}`, patch).catch(() => undefined);
  return getDb().select().from(workoutSets).where(eq(workoutSets.id, id)).get()!;
}

export function deleteWorkoutSet(id: string): void {
  getDb().delete(workoutSets).where(eq(workoutSets.id, id)).run();
  void apiDelete(`/train/sets/${id}`).catch(() => undefined);
}

export function getExerciseHistory(
  exerciseId: string,
): { startedAt: number; weightKg: number }[] {
  const rows = getDb()
    .select({
      sessionId: workoutSets.sessionId,
      startedAt: workoutSessions.startedAt,
      weightKg: workoutSets.weightKg,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.completed, true),
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .orderBy(workoutSessions.startedAt)
    .all();

  const bySession = new Map<string, { startedAt: number; weightKg: number }>();
  for (const row of rows) {
    const current = bySession.get(row.sessionId);
    if (!current || row.weightKg > current.weightKg) {
      bySession.set(row.sessionId, { startedAt: row.startedAt, weightKg: row.weightKg });
    }
  }
  return [...bySession.values()].sort((a, b) => a.startedAt - b.startedAt);
}
