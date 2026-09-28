import { apiPost } from '@/api/client';
import { getDose, markDoseTaken, undoDose } from '@/db/queries/doses';
import { adjustInventory, getSupplement } from '@/db/queries/supplements';
import type { DoseLog } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { doseInventoryDelta } from '@/domain/inventory';
import { onDoseOpened, onDoseTaken } from '@/notifications/sync';

function applyInventory(dose: DoseLog, sign: 1 | -1) {
  const supplement = getSupplement(dose.supplementId);
  if (!supplement || !supplement.trackInventory) return;
  const amount = doseInventoryDelta(supplement, dose);
  if (!amount) return;
  adjustInventory(supplement.id, sign * amount);
}

export async function takeDose(
  id: string,
  options: { amount?: number; unit?: DoseUnit; takenAt?: number } = {},
): Promise<DoseLog> {
  const before = getDose(id);
  const dose = markDoseTaken(id, options);
  if (!before?.takenAt) applyInventory(dose, -1);
  try {
    await apiPost(`/today/doses/${id}/take`, options);
  } catch {
    // local cache still updated
  }
  await onDoseTaken(id);
  return dose;
}

export async function untakeDose(id: string): Promise<DoseLog> {
  const before = getDose(id);
  const dose = undoDose(id);
  if (before?.takenAt) applyInventory(dose, 1);
  try {
    await apiPost(`/today/doses/${id}/undo`);
  } catch {
    // local cache still updated
  }
  await onDoseOpened();
  return dose;
}
