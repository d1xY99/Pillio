import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
import { createId } from '@/db/ids';
import { bodyWeights, progressPhotos, type BodyWeight, type ProgressPhoto } from '@/db/schema';
import type { PhotoPose } from '@/db/types';

export function listBodyWeights(limit = 90): BodyWeight[] {
  return getDb()
    .select()
    .from(bodyWeights)
    .orderBy(desc(bodyWeights.loggedAt))
    .limit(limit)
    .all();
}

export function getLatestBodyWeight(): BodyWeight | undefined {
  return getDb().select().from(bodyWeights).orderBy(desc(bodyWeights.loggedAt)).get();
}

export function addBodyWeight(input: { weightKg: number; loggedAt?: number; notes?: string | null }): BodyWeight {
  const id = createId();
  getDb()
    .insert(bodyWeights)
    .values({
      id,
      weightKg: input.weightKg,
      loggedAt: input.loggedAt ?? Date.now(),
      notes: input.notes ?? null,
    })
    .run();
  return getDb().select().from(bodyWeights).where(eq(bodyWeights.id, id)).get()!;
}

export function deleteBodyWeight(id: string): void {
  getDb().delete(bodyWeights).where(eq(bodyWeights.id, id)).run();
}

export function listProgressPhotos(pose?: PhotoPose): ProgressPhoto[] {
  const db = getDb();
  const rows = pose
    ? db.select().from(progressPhotos).where(eq(progressPhotos.pose, pose)).all()
    : db.select().from(progressPhotos).all();

  return rows.sort((a, b) => b.takenAt - a.takenAt);
}

export function getProgressPhoto(id: string): ProgressPhoto | undefined {
  return getDb().select().from(progressPhotos).where(eq(progressPhotos.id, id)).get();
}

export function addProgressPhoto(input: {
  localUri: string;
  pose: PhotoPose;
  takenAt?: number;
  notes?: string | null;
}): ProgressPhoto {
  const id = createId();
  getDb()
    .insert(progressPhotos)
    .values({
      id,
      localUri: input.localUri,
      pose: input.pose,
      takenAt: input.takenAt ?? Date.now(),
      notes: input.notes ?? null,
    })
    .run();
  return getProgressPhoto(id)!;
}

export function deleteProgressPhoto(id: string): void {
  getDb().delete(progressPhotos).where(eq(progressPhotos.id, id)).run();
}
