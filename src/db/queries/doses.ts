import { and, desc, eq, gte, isNotNull, lte } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { createId } from '@/db/ids';
import { doseLogs, type DoseLog, type NewDoseLog } from '@/db/schema';
import type { DoseUnit } from '@/db/types';

export type DoseInput = {
  supplementId: string;
  scheduleId?: string | null;
  scheduledFor: number;
  amount: number;
  unit: DoseUnit;
  notes?: string | null;
};

export function listDosesBetween(startMs: number, endMs: number): DoseLog[] {
  return getDb()
    .select()
    .from(doseLogs)
    .where(and(gte(doseLogs.scheduledFor, startMs), lte(doseLogs.scheduledFor, endMs)))
    .orderBy(doseLogs.scheduledFor)
    .all();
}

export function listDoseHistory(supplementId: string, limit = 60): DoseLog[] {
  return getDb()
    .select()
    .from(doseLogs)
    .where(eq(doseLogs.supplementId, supplementId))
    .orderBy(desc(doseLogs.scheduledFor))
    .limit(limit)
    .all();
}

export function getDose(id: string): DoseLog | undefined {
  return getDb().select().from(doseLogs).where(eq(doseLogs.id, id)).get();
}

export function findDoseForSchedule(scheduleId: string, scheduledFor: number): DoseLog | undefined {
  return getDb()
    .select()
    .from(doseLogs)
    .where(and(eq(doseLogs.scheduleId, scheduleId), eq(doseLogs.scheduledFor, scheduledFor)))
    .get();
}

export function upsertScheduledDose(input: DoseInput): DoseLog {
  if (input.scheduleId) {
    const existing = findDoseForSchedule(input.scheduleId, input.scheduledFor);
    if (existing) return existing;
  }

  const row: NewDoseLog = {
    id: createId(),
    supplementId: input.supplementId,
    scheduleId: input.scheduleId ?? null,
    scheduledFor: input.scheduledFor,
    takenAt: null,
    skipped: false,
    amount: input.amount,
    unit: input.unit,
    notes: input.notes ?? null,
  };

  getDb().insert(doseLogs).values(row).run();
  return getDose(row.id)!;
}

export function markDoseTaken(
  id: string,
  options: { amount?: number; unit?: DoseUnit; takenAt?: number } = {},
): DoseLog {
  getDb()
    .update(doseLogs)
    .set({
      takenAt: options.takenAt ?? Date.now(),
      skipped: false,
      ...(options.amount !== undefined ? { amount: options.amount } : {}),
      ...(options.unit !== undefined ? { unit: options.unit } : {}),
    })
    .where(eq(doseLogs.id, id))
    .run();

  return getDose(id)!;
}

export function markDoseSkipped(id: string): DoseLog {
  getDb()
    .update(doseLogs)
    .set({ skipped: true, takenAt: null })
    .where(eq(doseLogs.id, id))
    .run();
  return getDose(id)!;
}

export function undoDose(id: string): DoseLog {
  getDb()
    .update(doseLogs)
    .set({ takenAt: null, skipped: false })
    .where(eq(doseLogs.id, id))
    .run();
  return getDose(id)!;
}

export function listTakenDoses(supplementId: string): DoseLog[] {
  return getDb()
    .select()
    .from(doseLogs)
    .where(and(eq(doseLogs.supplementId, supplementId), isNotNull(doseLogs.takenAt)))
    .orderBy(desc(doseLogs.takenAt))
    .all();
}
