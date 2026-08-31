import { and, eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { createId } from '@/db/ids';
import { schedules, type NewSchedule, type Schedule } from '@/db/schema';
import type { ScheduleFrequency } from '@/db/types';

export type ScheduleInput = {
  supplementId: string;
  timeMinutes: number;
  frequency: ScheduleFrequency;
  intervalDays?: number | null;
  weekdaysMask?: number | null;
  cycleOnDays?: number | null;
  cycleOffDays?: number | null;
  reminderEnabled?: boolean;
  startDate: number;
  endDate?: number | null;
  active?: boolean;
};

export function listSchedulesForSupplement(supplementId: string): Schedule[] {
  return getDb()
    .select()
    .from(schedules)
    .where(and(eq(schedules.supplementId, supplementId), eq(schedules.active, true)))
    .all();
}

export function listActiveSchedules(): Schedule[] {
  return getDb().select().from(schedules).where(eq(schedules.active, true)).all();
}

export function getSchedule(id: string): Schedule | undefined {
  return getDb().select().from(schedules).where(eq(schedules.id, id)).get();
}

export function createSchedule(input: ScheduleInput): Schedule {
  const row: NewSchedule = {
    id: createId(),
    supplementId: input.supplementId,
    timeMinutes: input.timeMinutes,
    frequency: input.frequency,
    intervalDays: input.intervalDays ?? null,
    weekdaysMask: input.weekdaysMask ?? null,
    cycleOnDays: input.cycleOnDays ?? null,
    cycleOffDays: input.cycleOffDays ?? null,
    reminderEnabled: input.reminderEnabled ?? true,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    active: input.active ?? true,
  };

  getDb().insert(schedules).values(row).run();
  return getSchedule(row.id)!;
}

export function updateSchedule(id: string, patch: Partial<ScheduleInput>): Schedule {
  getDb()
    .update(schedules)
    .set({
      ...(patch.timeMinutes !== undefined ? { timeMinutes: patch.timeMinutes } : {}),
      ...(patch.frequency !== undefined ? { frequency: patch.frequency } : {}),
      ...(patch.intervalDays !== undefined ? { intervalDays: patch.intervalDays ?? null } : {}),
      ...(patch.weekdaysMask !== undefined ? { weekdaysMask: patch.weekdaysMask ?? null } : {}),
      ...(patch.cycleOnDays !== undefined ? { cycleOnDays: patch.cycleOnDays ?? null } : {}),
      ...(patch.cycleOffDays !== undefined ? { cycleOffDays: patch.cycleOffDays ?? null } : {}),
      ...(patch.reminderEnabled !== undefined ? { reminderEnabled: patch.reminderEnabled } : {}),
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
      ...(patch.endDate !== undefined ? { endDate: patch.endDate ?? null } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
    })
    .where(eq(schedules.id, id))
    .run();

  const updated = getSchedule(id);
  if (!updated) throw new Error(`Schedule ${id} was not found`);
  return updated;
}

export function deactivateSchedule(id: string): void {
  getDb().update(schedules).set({ active: false }).where(eq(schedules.id, id)).run();
}

export function replaceSchedulesForSupplement(
  supplementId: string,
  next: Omit<ScheduleInput, 'supplementId'>[],
): Schedule[] {
  const existing = getDb()
    .select()
    .from(schedules)
    .where(eq(schedules.supplementId, supplementId))
    .all();

  for (const row of existing) {
    getDb().update(schedules).set({ active: false }).where(eq(schedules.id, row.id)).run();
  }

  return next.map((item) => createSchedule({ ...item, supplementId }));
}
