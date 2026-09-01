import { and, eq } from 'drizzle-orm';

import { apiDelete, apiPatch, apiPost } from '@/api/client';
import { getDb } from '@/db/client';
import { notifyDbChanged } from '@/db/events';
import { keepLocalSlice } from '@/sync/cloud';
import { createId } from '@/db/ids';
import { habitLogs, habits, type Habit, type NewHabit } from '@/db/schema';

export type HabitInput = {
  name: string;
  emoji: string;
  color: string;
  category: string;
  notes?: string | null;
  frequency: string;
  weekdaysMask?: number | null;
  timesPerDay: number;
};

export function listHabits(archived = false): Habit[] {
  return getDb()
    .select()
    .from(habits)
    .where(eq(habits.archived, archived))
    .orderBy(habits.name)
    .all();
}

export function getHabit(id: string): Habit | undefined {
  return getDb().select().from(habits).where(eq(habits.id, id)).get();
}

export function createHabit(input: HabitInput): Habit {
  const id = createId();
  const row: NewHabit = {
    id,
    name: input.name.trim(),
    emoji: input.emoji,
    color: input.color,
    category: input.category,
    notes: input.notes?.trim() || null,
    frequency: input.frequency,
    weekdaysMask: input.weekdaysMask ?? null,
    timesPerDay: Math.min(8, Math.max(1, input.timesPerDay)),
    archived: false,
    createdAt: Date.now(),
  };
  getDb().insert(habits).values(row).run();
  keepLocalSlice('habits');
  notifyDbChanged();
  void apiPost('/habits', row).catch(() => undefined);
  return getHabit(id)!;
}

export function updateHabit(id: string, input: HabitInput): void {
  getDb()
    .update(habits)
    .set({
      name: input.name.trim(),
      emoji: input.emoji,
      color: input.color,
      category: input.category,
      notes: input.notes?.trim() || null,
      frequency: input.frequency,
      weekdaysMask: input.weekdaysMask ?? null,
      timesPerDay: Math.min(8, Math.max(1, input.timesPerDay)),
    })
    .where(eq(habits.id, id))
    .run();
  keepLocalSlice('habits');
  notifyDbChanged();
  void apiPatch(`/habits/${id}`, input).catch(() => undefined);
}

export function setHabitArchived(id: string, archived: boolean): void {
  getDb().update(habits).set({ archived }).where(eq(habits.id, id)).run();
  notifyDbChanged();
  void apiPatch(`/habits/${id}`, { archived }).catch(() => undefined);
}

export function deleteHabit(id: string): void {
  getDb().delete(habitLogs).where(eq(habitLogs.habitId, id)).run();
  getDb().delete(habits).where(eq(habits.id, id)).run();
  notifyDbChanged();
  void apiDelete(`/habits/${id}`).catch(() => undefined);
}

export function listHabitLogsOnDay(dayStart: number, dayEnd: number) {
  return getDb()
    .select()
    .from(habitLogs)
    .all()
    .filter(
      (row) => !row.skipped && row.scheduledFor >= dayStart && row.scheduledFor <= dayEnd,
    );
}

export function upsertHabitLog(input: {
  id?: string;
  habitId: string;
  scheduledFor: number;
  occurrence: number;
}): void {
  const existing = getDb()
    .select()
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.habitId, input.habitId),
        eq(habitLogs.scheduledFor, input.scheduledFor),
        eq(habitLogs.occurrence, input.occurrence),
      ),
    )
    .get();
  if (existing) return;
  try {
    getDb()
      .insert(habitLogs)
      .values({
        id: input.id ?? createId(),
        habitId: input.habitId,
        scheduledFor: input.scheduledFor,
        occurrence: input.occurrence,
        takenAt: null,
        skipped: false,
      })
      .run();
    notifyDbChanged();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/unique|constraint|duplicate/i.test(message)) throw error;
  }
}

export function markHabitLog(id: string, taken: boolean): void {
  getDb()
    .update(habitLogs)
    .set({ takenAt: taken ? Date.now() : null, skipped: false })
    .where(eq(habitLogs.id, id))
    .run();
  notifyDbChanged();
  void apiPost(`/habits/logs/${id}/${taken ? 'take' : 'undo'}`).catch(() => undefined);
}
