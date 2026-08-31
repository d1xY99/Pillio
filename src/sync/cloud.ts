import { eq } from 'drizzle-orm';

import { getDb } from '@/db/client';
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
import { notifyDbChanged } from '@/db/events';

let timer: ReturnType<typeof setTimeout> | null = null;

export function schedulePush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void pushToCloud();
  }, 900);
}

export async function pullFromCloud() {
  const supabase = getSupabase();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const db = getDb();
  const remoteSupplements = await supabase.from('supplements').select('*').eq('user_id', user.id);
  if (remoteSupplements.error) return;
  if ((remoteSupplements.data?.length ?? 0) === 0) {
    await pushToCloud();
    return;
  }

  db.delete(doseLogs).run();
  db.delete(schedules).run();
  db.delete(supplements).run();
  db.delete(workoutSets).run();
  db.delete(workoutSessions).run();
  db.delete(bodyWeights).run();
  db.delete(progressPhotos).run();
  db.delete(exercises).where(eq(exercises.isPreset, false)).run();

  const mapRows: Record<string, unknown[] | null> = {
    supplements: (await supabase.from('supplements').select('*').eq('user_id', user.id)).data,
    schedules: (await supabase.from('schedules').select('*').eq('user_id', user.id)).data,
    dose_logs: (await supabase.from('dose_logs').select('*').eq('user_id', user.id)).data,
    exercises: (await supabase.from('exercises').select('*').eq('user_id', user.id)).data,
    workout_sessions: (await supabase.from('workout_sessions').select('*').eq('user_id', user.id)).data,
    workout_sets: (await supabase.from('workout_sets').select('*').eq('user_id', user.id)).data,
    body_weights: (await supabase.from('body_weights').select('*').eq('user_id', user.id)).data,
    progress_photos: (await supabase.from('progress_photos').select('*').eq('user_id', user.id)).data,
  };

  insertMapped(mapRows.supplements, (row) =>
    db.insert(supplements).values(fromSupplement(row)).run(),
  );
  insertMapped(mapRows.schedules, (row) => db.insert(schedules).values(fromSchedule(row)).run());
  insertMapped(mapRows.dose_logs, (row) => db.insert(doseLogs).values(fromDose(row)).run());
  insertMapped(mapRows.exercises, (row) => {
    if (row.is_preset) return;
    db.insert(exercises).values(fromExercise(row)).run();
  });
  insertMapped(mapRows.workout_sessions, (row) =>
    db.insert(workoutSessions).values(fromSession(row)).run(),
  );
  insertMapped(mapRows.workout_sets, (row) => db.insert(workoutSets).values(fromSet(row)).run());
  insertMapped(mapRows.body_weights, (row) => db.insert(bodyWeights).values(fromWeight(row)).run());
  insertMapped(mapRows.progress_photos, (row) =>
    db.insert(progressPhotos).values(fromPhoto(row)).run(),
  );

  notifyDbChanged();
}

export async function pushToCloud() {
  const supabase = getSupabase();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const db = getDb();
  const uid = user.id;

  const allSupplements = db.select().from(supplements).all();
  const allSchedules = db.select().from(schedules).all();
  const allDoses = db.select().from(doseLogs).all();
  const allExercises = db.select().from(exercises).all().filter((row) => !row.isPreset);
  const allSessions = db.select().from(workoutSessions).all();
  const allSets = db.select().from(workoutSets).all();
  const allWeights = db.select().from(bodyWeights).all();
  const allPhotos = db.select().from(progressPhotos).all();

  if (allSupplements.length) {
    await supabase.from('supplements').upsert(allSupplements.map((row) => toSupplement(row, uid)));
  }
  if (allSchedules.length) {
    await supabase.from('schedules').upsert(allSchedules.map((row) => toSchedule(row, uid)));
  }
  if (allDoses.length) {
    await supabase.from('dose_logs').upsert(allDoses.map((row) => toDose(row, uid)));
  }
  if (allExercises.length) {
    await supabase.from('exercises').upsert(allExercises.map((row) => toExercise(row, uid)));
  }
  if (allSessions.length) {
    await supabase.from('workout_sessions').upsert(allSessions.map((row) => toSession(row, uid)));
  }
  if (allSets.length) {
    await supabase.from('workout_sets').upsert(allSets.map((row) => toSet(row, uid)));
  }
  if (allWeights.length) {
    await supabase.from('body_weights').upsert(allWeights.map((row) => toWeight(row, uid)));
  }
  if (allPhotos.length) {
    await supabase.from('progress_photos').upsert(allPhotos.map((row) => toPhoto(row, uid)));
  }
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
