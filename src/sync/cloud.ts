import { eq } from 'drizzle-orm';

import { flushLocalPersist, getDb } from '@/db/client';
import { notifyDbChanged } from '@/db/events';
import {
  bodyWeights,
  doseLogs,
  exercises,
  progressPhotos,
  schedules,
  supplements,
  workoutSessions,
  workoutSets,
} from '@/db/schema';
import { getSupabase } from '@/lib/supabase';

let timer: ReturnType<typeof setTimeout> | null = null;
let syncDepth = 0;
let clearing: Promise<void> | null = null;

export type CloudSlice = 'stack' | 'gym' | 'body';

const SLICES: Record<CloudSlice, readonly string[]> = {
  stack: ['supplements', 'schedules', 'dose_logs'],
  gym: ['exercises', 'workout_sessions', 'workout_sets'],
  body: ['body_weights', 'progress_photos'],
};

const pulled = new Set<CloudSlice>();
const inflight = new Map<CloudSlice, Promise<void>>();

export function resetCloudPullState() {
  pulled.clear();
  inflight.clear();
}

export function beginCloudQuiet() {
  syncDepth += 1;
  cancelScheduledPush();
}

export function endCloudQuiet() {
  syncDepth = Math.max(0, syncDepth - 1);
}

export function cancelScheduledPush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

export function schedulePush() {
  if (syncDepth > 0) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void pushToCloud();
  }, 800);
}

function wipeLocalUserRows() {
  const db = getDb();
  db.delete(doseLogs).run();
  db.delete(schedules).run();
  db.delete(supplements).run();
  db.delete(workoutSets).run();
  db.delete(workoutSessions).run();
  db.delete(bodyWeights).run();
  db.delete(progressPhotos).run();
  db.delete(exercises).where(eq(exercises.isPreset, false)).run();
}

export async function clearLocalUserData() {
  if (clearing) return clearing;
  clearing = (async () => {
    beginCloudQuiet();
    try {
      wipeLocalUserRows();
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

async function sessionUserId() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
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
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = await sessionUserId();
  if (!userId) return;

  const tables = SLICES[slice];
  const results = await Promise.all(
    tables.map((table) => supabase.from(table).select('*').eq('user_id', userId)),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.warn(`[pillio] cloud pull ${slice}:`, failed.error.message);
    return;
  }

  const mapRows: Record<string, unknown[] | null> = {};
  tables.forEach((table, index) => {
    mapRows[table] = results[index].data;
  });

  if (slice === 'stack' && (mapRows.supplements?.length ?? 0) === 0) {
    pulled.add(slice);
    const localCount = getDb().select().from(supplements).all().length;
    if (localCount) await pushToCloud({ reconcile: false });
    return;
  }

  beginCloudQuiet();
  try {
    wipeSlice(slice);
    for (const table of tables) writeTable(table, mapRows[table]);
    await flushLocalPersist();
    notifyDbChanged();
    pulled.add(slice);
  } finally {
    endCloudQuiet();
  }
}

function wipeSlice(slice: CloudSlice) {
  const db = getDb();
  for (const table of [...SLICES[slice]].reverse()) {
    if (table === 'dose_logs') db.delete(doseLogs).run();
    else if (table === 'schedules') db.delete(schedules).run();
    else if (table === 'supplements') db.delete(supplements).run();
    else if (table === 'workout_sets') db.delete(workoutSets).run();
    else if (table === 'workout_sessions') db.delete(workoutSessions).run();
    else if (table === 'exercises') db.delete(exercises).where(eq(exercises.isPreset, false)).run();
    else if (table === 'body_weights') db.delete(bodyWeights).run();
    else if (table === 'progress_photos') db.delete(progressPhotos).run();
  }
}

function writeTable(table: string, rows: unknown[] | null | undefined) {
  const db = getDb();
  if (table === 'supplements') {
    insertMapped(rows, (row) => db.insert(supplements).values(fromSupplement(row)).run());
  } else if (table === 'schedules') {
    insertMapped(rows, (row) => db.insert(schedules).values(fromSchedule(row)).run());
  } else if (table === 'dose_logs') {
    insertMapped(rows, (row) => db.insert(doseLogs).values(fromDose(row)).run());
  } else if (table === 'exercises') {
    insertMapped(rows, (row) => {
      if (row.is_preset) return;
      db.insert(exercises).values(fromExercise(row)).run();
    });
  } else if (table === 'workout_sessions') {
    insertMapped(rows, (row) => db.insert(workoutSessions).values(fromSession(row)).run());
  } else if (table === 'workout_sets') {
    insertMapped(rows, (row) => db.insert(workoutSets).values(fromSet(row)).run());
  } else if (table === 'body_weights') {
    insertMapped(rows, (row) => db.insert(bodyWeights).values(fromWeight(row)).run());
  } else if (table === 'progress_photos') {
    insertMapped(rows, (row) => db.insert(progressPhotos).values(fromPhoto(row)).run());
  }
}

function sliceHasLocal(slice: CloudSlice) {
  const db = getDb();
  if (slice === 'stack') return db.select().from(supplements).all().length > 0;
  if (slice === 'gym') {
    return (
      db.select().from(workoutSessions).all().length > 0 ||
      db.select().from(exercises).all().some((row) => !row.isPreset)
    );
  }
  return (
    db.select().from(bodyWeights).all().length > 0 || db.select().from(progressPhotos).all().length > 0
  );
}

export async function pushToCloud(options: { reconcile?: boolean } = {}) {
  const supabase = getSupabase();
  if (!supabase) return;
  const uid = await sessionUserId();
  if (!uid) return;
  const db = getDb();
  const reconcile = options.reconcile ?? true;

  const allSupplements = db.select().from(supplements).all();
  const allSchedules = db.select().from(schedules).all();
  const allDoses = db.select().from(doseLogs).all();
  const allExercises = db.select().from(exercises).all().filter((row) => !row.isPreset);
  const allSessions = db.select().from(workoutSessions).all();
  const allSets = db.select().from(workoutSets).all();
  const allWeights = db.select().from(bodyWeights).all();
  const allPhotos = db.select().from(progressPhotos).all();

  const pushStack = pulled.has('stack') || sliceHasLocal('stack');
  const pushGym = pulled.has('gym') || sliceHasLocal('gym');
  const pushBody = pulled.has('body') || sliceHasLocal('body');

  const parents: Promise<void>[] = [];
  if (pushStack) parents.push(upsert('supplements', allSupplements.map((row) => toSupplement(row, uid))));
  if (pushGym) {
    parents.push(upsert('exercises', allExercises.map((row) => toExercise(row, uid))));
    parents.push(upsert('workout_sessions', allSessions.map((row) => toSession(row, uid))));
  }
  if (pushBody) {
    parents.push(upsert('body_weights', allWeights.map((row) => toWeight(row, uid))));
    parents.push(upsert('progress_photos', allPhotos.map((row) => toPhoto(row, uid))));
  }
  await Promise.all(parents);

  const children: Promise<void>[] = [];
  if (pushStack) {
    children.push(upsert('schedules', allSchedules.map((row) => toSchedule(row, uid))));
    children.push(upsert('dose_logs', allDoses.map((row) => toDose(row, uid))));
  }
  if (pushGym) children.push(upsert('workout_sets', allSets.map((row) => toSet(row, uid))));
  await Promise.all(children);

  if (!reconcile) return;

  const missing: Promise<void>[] = [];
  if (pulled.has('stack')) {
    missing.push(deleteMissing('dose_logs', uid, ids(allDoses)));
    missing.push(deleteMissing('schedules', uid, ids(allSchedules)));
    missing.push(deleteMissing('supplements', uid, ids(allSupplements)));
  }
  if (pulled.has('gym')) {
    missing.push(deleteMissing('workout_sets', uid, ids(allSets)));
    missing.push(deleteMissing('workout_sessions', uid, ids(allSessions)));
    missing.push(deleteMissing('exercises', uid, ids(allExercises)));
  }
  if (pulled.has('body')) {
    missing.push(deleteMissing('body_weights', uid, ids(allWeights)));
    missing.push(deleteMissing('progress_photos', uid, ids(allPhotos)));
  }
  await Promise.all(missing);
}

function ids(rows: { id: string }[]) {
  return rows.map((row) => row.id);
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) {
    console.warn(`[pillio] cloud push ${table}:`, error.message);
  }
}

async function deleteMissing(table: string, userId: string, localIds: string[]) {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase.from(table).select('id').eq('user_id', userId);
  if (error) {
    console.warn(`[pillio] cloud list ${table}:`, error.message);
    return;
  }
  const keep = new Set(localIds);
  const extra = (data ?? []).map((row) => String(row.id)).filter((id) => !keep.has(id));
  for (let i = 0; i < extra.length; i += 100) {
    const chunk = extra.slice(i, i + 100);
    const { error: delError } = await supabase.from(table).delete().in('id', chunk);
    if (delError) {
      console.warn(`[pillio] cloud delete ${table}:`, delError.message);
    }
  }
}

function flushPushNow() {
  cancelScheduledPush();
  void pushToCloud();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPushNow();
  });
  window.addEventListener('pagehide', flushPushNow);
}

function insertMapped(rows: unknown[] | null | undefined, write: (row: any) => void) {
  for (const row of rows ?? []) {
    try {
      write(row);
    } catch {
      // skip malformed
    }
  }
}

function toSupplement(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    name: row.name,
    type: row.type,
    form: row.form,
    default_amount: row.defaultAmount,
    default_unit: row.defaultUnit,
    color: row.color,
    notes: row.notes,
    archived: row.archived,
    created_at: row.createdAt,
  };
}

function fromSupplement(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    form: row.form,
    defaultAmount: row.default_amount,
    defaultUnit: row.default_unit,
    color: row.color,
    notes: row.notes,
    archived: Boolean(row.archived),
    createdAt: Number(row.created_at),
  };
}

function toSchedule(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    supplement_id: row.supplementId,
    time_minutes: row.timeMinutes,
    frequency: row.frequency,
    interval_days: row.intervalDays,
    weekdays_mask: row.weekdaysMask,
    cycle_on_days: row.cycleOnDays,
    cycle_off_days: row.cycleOffDays,
    reminder_enabled: row.reminderEnabled,
    start_date: row.startDate,
    end_date: row.endDate,
    active: row.active,
  };
}

function fromSchedule(row: any) {
  return {
    id: row.id,
    supplementId: row.supplement_id,
    timeMinutes: row.time_minutes,
    frequency: row.frequency,
    intervalDays: row.interval_days,
    weekdaysMask: row.weekdays_mask,
    cycleOnDays: row.cycle_on_days,
    cycleOffDays: row.cycle_off_days,
    reminderEnabled: Boolean(row.reminder_enabled),
    startDate: Number(row.start_date),
    endDate: row.end_date == null ? null : Number(row.end_date),
    active: Boolean(row.active),
  };
}

function toDose(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    supplement_id: row.supplementId,
    schedule_id: row.scheduleId,
    scheduled_for: row.scheduledFor,
    taken_at: row.takenAt,
    skipped: row.skipped,
    amount: row.amount,
    unit: row.unit,
    notes: row.notes,
  };
}

function fromDose(row: any) {
  return {
    id: row.id,
    supplementId: row.supplement_id,
    scheduleId: row.schedule_id,
    scheduledFor: Number(row.scheduled_for),
    takenAt: row.taken_at == null ? null : Number(row.taken_at),
    skipped: Boolean(row.skipped),
    amount: Number(row.amount),
    unit: row.unit,
    notes: row.notes,
  };
}

function toExercise(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    name: row.name,
    muscle_group: row.muscleGroup,
    archived: row.archived,
    is_preset: row.isPreset,
  };
}

function fromExercise(row: any) {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    archived: Boolean(row.archived),
    isPreset: Boolean(row.is_preset),
  };
}

function toSession(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    started_at: row.startedAt,
    finished_at: row.finishedAt,
    notes: row.notes,
  };
}

function fromSession(row: any) {
  return {
    id: row.id,
    startedAt: Number(row.started_at),
    finishedAt: row.finished_at == null ? null : Number(row.finished_at),
    notes: row.notes,
  };
}

function toSet(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    session_id: row.sessionId,
    exercise_id: row.exerciseId,
    set_index: row.setIndex,
    reps: row.reps,
    weight_kg: row.weightKg,
    completed: row.completed,
  };
}

function fromSet(row: any) {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setIndex: row.set_index,
    reps: row.reps,
    weightKg: Number(row.weight_kg),
    completed: Boolean(row.completed),
  };
}

function toWeight(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    logged_at: row.loggedAt,
    weight_kg: row.weightKg,
    notes: row.notes,
  };
}

function fromWeight(row: any) {
  return {
    id: row.id,
    loggedAt: Number(row.logged_at),
    weightKg: Number(row.weight_kg),
    notes: row.notes,
  };
}

function toPhoto(row: any, user_id: string) {
  return {
    id: row.id,
    user_id,
    taken_at: row.takenAt,
    local_uri: row.localUri,
    pose: row.pose,
    notes: row.notes,
  };
}

function fromPhoto(row: any) {
  return {
    id: row.id,
    takenAt: Number(row.taken_at),
    localUri: row.local_uri,
    pose: row.pose,
    notes: row.notes,
  };
}
