import { apiPost } from '@/api/client';
import { markDoseTaken, undoDose } from '@/db/queries/doses';
import type { DoseLog } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { onDoseOpened, onDoseTaken } from '@/notifications/sync';

export async function takeDose(
  id: string,
  options: { amount?: number; unit?: DoseUnit; takenAt?: number } = {},
): Promise<DoseLog> {
  const dose = markDoseTaken(id, options);
  try {
    await apiPost(`/today/doses/${id}/take`, options);
  } catch {
    // local cache still updated
  }
  await onDoseTaken(id);
  return dose;
}

export async function untakeDose(id: string): Promise<DoseLog> {
  const dose = undoDose(id);
  try {
    await apiPost(`/today/doses/${id}/undo`);
  } catch {
    // local cache still updated
  }
  await onDoseOpened();
  return dose;
}
