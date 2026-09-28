import { and, desc, eq } from 'drizzle-orm';

import { apiDelete, apiPatch, apiPost } from '@/api/client';
import { getDb } from '@/db/client';
import { notifyDbChanged } from '@/db/events';
import { createId } from '@/db/ids';
import { doseLogs, schedules, supplements, type NewSupplement, type Supplement } from '@/db/schema';
import type { DoseUnit, DrawDisplay, SupplementForm, SupplementType } from '@/db/types';

export type SupplementInput = {
  name: string;
  type: SupplementType;
  form: SupplementForm;
  defaultAmount: number;
  defaultUnit: DoseUnit;
  color: string;
  notes?: string | null;
  vialMg?: number | null;
  bacMl?: number | null;
  drawDisplay?: DrawDisplay;
  trackInventory?: boolean;
  quantityOnHand?: number | null;
  inventoryUnit?: DoseUnit | null;
  inventoryPackSize?: number | null;
  lowStockThreshold?: number | null;
  refillReminder?: boolean;
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
    vialMg: input.type === 'peptide' ? input.vialMg ?? null : null,
    bacMl: input.type === 'peptide' ? input.bacMl ?? null : null,
    drawDisplay: input.drawDisplay ?? 'units',
    trackInventory: input.trackInventory ?? false,
    quantityOnHand: input.trackInventory ? input.quantityOnHand ?? null : null,
    inventoryUnit: input.trackInventory ? input.inventoryUnit ?? input.defaultUnit : null,
    inventoryPackSize: input.trackInventory ? input.inventoryPackSize ?? null : null,
    lowStockThreshold: input.trackInventory ? input.lowStockThreshold ?? null : null,
    refillReminder: input.trackInventory ? input.refillReminder ?? true : false,
    archived: false,
    createdAt: Date.now(),
  };

  getDb().insert(supplements).values(row).run();
  notifyDbChanged();
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
      ...(patch.vialMg !== undefined ? { vialMg: patch.vialMg } : {}),
      ...(patch.bacMl !== undefined ? { bacMl: patch.bacMl } : {}),
      ...(patch.drawDisplay !== undefined ? { drawDisplay: patch.drawDisplay } : {}),
      ...(patch.trackInventory !== undefined ? { trackInventory: patch.trackInventory } : {}),
      ...(patch.quantityOnHand !== undefined ? { quantityOnHand: patch.quantityOnHand } : {}),
      ...(patch.inventoryUnit !== undefined ? { inventoryUnit: patch.inventoryUnit } : {}),
      ...(patch.inventoryPackSize !== undefined ? { inventoryPackSize: patch.inventoryPackSize } : {}),
      ...(patch.lowStockThreshold !== undefined ? { lowStockThreshold: patch.lowStockThreshold } : {}),
      ...(patch.refillReminder !== undefined ? { refillReminder: patch.refillReminder } : {}),
      ...(patch.trackInventory === false
        ? {
            quantityOnHand: null,
            inventoryUnit: null,
            inventoryPackSize: null,
            lowStockThreshold: null,
            refillReminder: false,
          }
        : {}),
      ...(patch.type !== undefined && patch.type !== 'peptide' ? { vialMg: null, bacMl: null } : {}),
    })
    .where(eq(supplements.id, id))
    .run();

  notifyDbChanged();
  const updated = getSupplement(id);
  if (!updated) throw new Error(`Supplement ${id} was not found`);
  return updated;
}

export function setSupplementArchived(id: string, archived: boolean): void {
  getDb().update(supplements).set({ archived }).where(eq(supplements.id, id)).run();
  void apiPost(`/stack/${id}/archive`, { archived }).catch(() => undefined);
}

export function deleteSupplement(id: string): void {
  const db = getDb();
  db.delete(doseLogs).where(eq(doseLogs.supplementId, id)).run();
  db.delete(schedules).where(eq(schedules.supplementId, id)).run();
  db.delete(supplements).where(eq(supplements.id, id)).run();
  void apiDelete(`/stack/${id}`).catch(() => undefined);
}

export function listRecentSupplements(): Supplement[] {
  return getDb()
    .select()
    .from(supplements)
    .where(and(eq(supplements.archived, false)))
    .orderBy(desc(supplements.createdAt))
    .all();
}

export function setInventoryQuantity(supplementId: string, quantity: number | null): void {
  getDb()
    .update(supplements)
    .set({ quantityOnHand: quantity })
    .where(eq(supplements.id, supplementId))
    .run();
  notifyDbChanged();
  void apiPatch(`/stack/${supplementId}`, { quantityOnHand: quantity }).catch(() => undefined);
}

export function adjustInventory(supplementId: string, delta: number): void {
  const supplement = getSupplement(supplementId);
  if (!supplement || !supplement.trackInventory || supplement.quantityOnHand == null || !delta) return;
  const next = Math.max(0, Math.round((supplement.quantityOnHand + delta) * 1000) / 1000);
  setInventoryQuantity(supplementId, next);
}
