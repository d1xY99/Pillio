import { markDoseTaken, undoDose } from '@/db/queries/doses';
import type { DoseLog } from '@/db/schema';
import type { DoseUnit } from '@/db/types';
import { onDoseOpened, onDoseTaken } from '@/notifications/sync';
import { schedulePush } from '@/sync/cloud';

export async function takeDose(
  id: string,
  options: { amount?: number; unit?: DoseUnit; takenAt?: number } = {},
): Promise<DoseLog> {
  const dose = markDoseTaken(id, options);
  schedulePush();
  await onDoseTaken(id);
  return dose;
}

export async function untakeDose(id: string): Promise<DoseLog> {
  const dose = undoDose(id);
  schedulePush();
  await onDoseOpened();
  return dose;
}
