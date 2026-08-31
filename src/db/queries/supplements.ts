import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { createId } from '@/db/ids';
import { doseLogs, schedules, supplements, type NewSupplement, type Supplement } from '@/db/schema';
import type { DoseUnit, SupplementForm, SupplementType } from '@/db/types';

export type SupplementInput = {
  name: string;
  type: SupplementType;
  form: SupplementForm;
  defaultAmount: number;
  defaultUnit: DoseUnit;
  color: string;
  notes?: string | null;
};

export function listSupplements(options: { archived?: boolean } = {}): Supplement[] {
  const db = getDb();
  const archived = options.archived ?? false;
  return db
    .select()
    .from(supplements)
    .where(eq(supplements.archived, archived))
    .orderBy(supplements.name)
    .all();
}

export function listAllSupplements(): Supplement[] {
  return getDb().select().from(supplements).orderBy(supplements.name).all();
}

export function getSupplement(id: string): Supplement | undefined {
  return getDb().select().from(supplements).where(eq(supplements.id, id)).get();
}

export function createSupplement(input: SupplementInput): Supplement {
  const row: NewSupplement = {
    id: createId(),
    name: input.name.trim(),
    type: input.type,
    form: input.form,
    defaultAmount: input.defaultAmount,
    defaultUnit: input.defaultUnit,
    color: input.color,
    notes: input.notes?.trim() || null,
    archived: false,
    createdAt: Date.now(),
  };

  getDb().insert(supplements).values(row).run();
  return getSupplement(row.id)!;
}

export function updateSupplement(id: string, patch: Partial<SupplementInput>): Supplement {
  getDb()
    .update(supplements)
    .set({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.form !== undefined ? { form: patch.form } : {}),
      ...(patch.defaultAmount !== undefined ? { defaultAmount: patch.defaultAmount } : {}),
      ...(patch.defaultUnit !== undefined ? { defaultUnit: patch.defaultUnit } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes?.trim() || null } : {}),
    })
    .where(eq(supplements.id, id))
    .run();

  const updated = getSupplement(id);
  if (!updated) throw new Error(`Supplement ${id} was not found`);
  return updated;
}

export function setSupplementArchived(id: string, archived: boolean): void {
  getDb().update(supplements).set({ archived }).where(eq(supplements.id, id)).run();
}

export function deleteSupplement(id: string): void {
  const db = getDb();
  db.delete(doseLogs).where(eq(doseLogs.supplementId, id)).run();
  db.delete(schedules).where(eq(schedules.supplementId, id)).run();
  db.delete(supplements).where(eq(supplements.id, id)).run();
}

export function listRecentSupplements(): Supplement[] {
  return getDb()
    .select()
    .from(supplements)
    .where(and(eq(supplements.archived, false)))
    .orderBy(desc(supplements.createdAt))
    .all();
}
