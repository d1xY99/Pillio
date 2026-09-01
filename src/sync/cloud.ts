import { eq } from 'drizzle-orm';

import { apiGet, clientTz } from '@/api/client';
import { flushLocalPersist, getDb } from '@/db/client';
import { notifyDbChanged } from '@/db/events';
import {
  bodyWeights,
  doseLogs,
  exercises,
  habitLogs,
  habits,
  progressPhotos,
  schedules,
  supplements,
  workoutSessions,
  workoutSets,
} from '@/db/schema';
import { startOfLocalDay, endOfLocalDay } from '@/domain/time';

export type CloudSlice = 'stack' | 'gym' | 'body' | 'habits';

let syncDepth = 0;
let clearing: Promise<void> | null = null;
const pulled = new Set<CloudSlice>();
const inflight = new Map<CloudSlice, Promise<void>>();
const pullEpoch: Partial<Record<CloudSlice, number>> = {};

export function keepLocalSlice(slice: CloudSlice) {
  pulled.add(slice);
  pullEpoch[slice] = (pullEpoch[slice] ?? 0) + 1;
}

export function beginCloudQuiet() {
  syncDepth += 1;
}

export function endCloudQuiet() {
  syncDepth = Math.max(0, syncDepth - 1);
}

export function cancelScheduledPush() {}

export function schedulePush() {}

export function resetCloudPullState() {
  pulled.clear();
  inflight.clear();
  for (const key of Object.keys(pullEpoch) as CloudSlice[]) delete pullEpoch[key];
}

function wipeSlice(slice: CloudSlice) {
  const db = getDb();
  if (slice === 'stack') {
    db.delete(doseLogs).run();
    db.delete(schedules).run();
    db.delete(supplements).run();
  } else if (slice === 'gym') {
    db.delete(workoutSets).run();
    db.delete(workoutSessions).run();
    db.delete(exercises).where(eq(exercises.isPreset, false)).run();
  } else if (slice === 'habits') {
    db.delete(habitLogs).run();
    db.delete(habits).run();
  } else {
    db.delete(bodyWeights).run();
    db.delete(progressPhotos).run();
  }
}

function insertRows(write: (row: any) => void, rows: any[] | undefined) {
  for (const row of rows ?? []) {
    try {
      write(row);
    } catch {
      // skip dup
    }
  }
}

export async function clearLocalUserData() {
  if (clearing) return clearing;
  clearing = (async () => {
    beginCloudQuiet();
    try {
      wipeSlice('stack');
      wipeSlice('gym');
      wipeSlice('body');
      wipeSlice('habits');
      resetCloudPullState();
      await flushLocalPersist();
    } finally {
      endCloudQuiet();
    }
    notifyDbChanged();
  })();
  try {
    await clearing;
  } finally {
    clearing = null;
  }
}

export async function pullFromCloud() {
  await pullSlice('stack');
}

export async function pullSlice(slice: CloudSlice) {
  if (pulled.has(slice)) return;
  const pending = inflight.get(slice);
  if (pending) return pending;
  const work = doPullSlice(slice);
  inflight.set(slice, work);
  try {
    await work;
  } finally {
    inflight.delete(slice);
  }
}

async function doPullSlice(slice: CloudSlice) {
  if (pulled.has(slice)) return;
  const epoch = pullEpoch[slice] ?? 0;
  beginCloudQuiet();
  try {
    if (slice === 'stack') {
      const tz = clientTz();
      const from = startOfLocalDay(tz.now);
      const to = endOfLocalDay(tz.now);
      const data = await apiGet<{
        supplements: any[];
        schedules: any[];
        doseLogs: any[];
      }>(`/today?from=${from}&to=${to}&tzOffset=${tz.tzOffset}&now=${tz.now}`);
      if ((pullEpoch[slice] ?? 0) !== epoch) return;
      wipeSlice('stack');
      const db = getDb();
      insertRows((row) => db.insert(supplements).values(row).run(), data.supplements);
      insertRows((row) => db.insert(schedules).values(row).run(), data.schedules);
      insertRows((row) => db.insert(doseLogs).values(row).run(), data.doseLogs);
    } else if (slice === 'habits') {
      const tz = clientTz();
      const from = startOfLocalDay(tz.now);
      const to = endOfLocalDay(tz.now);
      const data = await apiGet<{ habits: any[]; logs: any[] }>(
        `/habits?from=${from}&to=${to}&tzOffset=${tz.tzOffset}&now=${tz.now}`,
      );
      if ((pullEpoch[slice] ?? 0) !== epoch) return;
      const db = getDb();
      insertRows((row) => db.insert(habits).values(row).run(), data.habits);
      insertRows((row) => db.insert(habitLogs).values(row).run(), data.logs);
    } else if (slice === 'gym') {
      const data = await apiGet<{ exercises: any[]; sessions: any[]; sets: any[] }>('/train');
      wipeSlice('gym');
      const db = getDb();
      insertRows(
        (row) => db.insert(exercises).values(row).run(),
        (data.exercises ?? []).filter((row) => !row.isPreset),
      );
      insertRows((row) => db.insert(workoutSessions).values(row).run(), data.sessions);
      insertRows((row) => db.insert(workoutSets).values(row).run(), data.sets);
    } else {
      const data = await apiGet<{ weights: any[]; photos: any[] }>('/body');
      wipeSlice('body');
      const db = getDb();
      insertRows((row) => db.insert(bodyWeights).values(row).run(), data.weights);
      insertRows((row) => db.insert(progressPhotos).values(row).run(), data.photos);
    }
    await flushLocalPersist();
    notifyDbChanged();
    pulled.add(slice);
  } finally {
    endCloudQuiet();
  }
}

export async function pushToCloud() {
  // Mutations go through /api. Kept so older call sites compile.
}
