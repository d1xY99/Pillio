export type Supplement = {
  id: string;
  name: string;
  type: string;
  form: string;
  defaultAmount: number;
  defaultUnit: string;
  color: string;
  notes: string | null;
  vialMg: number | null;
  bacMl: number | null;
  drawDisplay: 'units' | 'ml';
  archived: boolean;
  createdAt: number;
};

export type Schedule = {
  id: string;
  supplementId: string;
  timeMinutes: number;
  frequency: string;
  intervalDays: number | null;
  weekdaysMask: number | null;
  cycleOnDays: number | null;
  cycleOffDays: number | null;
  reminderEnabled: boolean;
  startDate: number;
  endDate: number | null;
  active: boolean;
};

export type DoseLog = {
  id: string;
  supplementId: string;
  scheduleId: string | null;
  scheduledFor: number;
  takenAt: number | null;
  skipped: boolean;
  amount: number;
  unit: string;
  notes: string | null;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  archived: boolean;
  isPreset: boolean;
};

export type WorkoutSession = {
  id: string;
  startedAt: number;
  finishedAt: number | null;
  notes: string | null;
};

export type WorkoutSet = {
  id: string;
  sessionId: string;
  exerciseId: string;
  setIndex: number;
  reps: number;
  weightKg: number;
  completed: boolean;
};

export type BodyWeight = {
  id: string;
  weightKg: number;
  loggedAt: number;
  notes: string | null;
};

export type ProgressPhoto = {
  id: string;
  localUri: string;
  pose: string;
  takenAt: number;
  notes: string | null;
};

export function supplement(row: any): Supplement {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    form: row.form,
    defaultAmount: Number(row.default_amount),
    defaultUnit: row.default_unit,
    color: row.color,
    notes: row.notes ?? null,
    vialMg: row.vial_mg == null ? null : Number(row.vial_mg),
    bacMl: row.bac_ml == null ? null : Number(row.bac_ml),
    drawDisplay: row.draw_display === 'ml' ? 'ml' : 'units',
    archived: Boolean(row.archived),
    createdAt: Number(row.created_at),
  };
}

export function schedule(row: any): Schedule {
  return {
    id: row.id,
    supplementId: row.supplement_id,
    timeMinutes: Number(row.time_minutes),
    frequency: row.frequency,
    intervalDays: row.interval_days == null ? null : Number(row.interval_days),
    weekdaysMask: row.weekdays_mask == null ? null : Number(row.weekdays_mask),
    cycleOnDays: row.cycle_on_days == null ? null : Number(row.cycle_on_days),
    cycleOffDays: row.cycle_off_days == null ? null : Number(row.cycle_off_days),
    reminderEnabled: Boolean(row.reminder_enabled),
    startDate: Number(row.start_date),
    endDate: row.end_date == null ? null : Number(row.end_date),
    active: Boolean(row.active),
  };
}

export function dose(row: any): DoseLog {
  return {
    id: row.id,
    supplementId: row.supplement_id,
    scheduleId: row.schedule_id ?? null,
    scheduledFor: Number(row.scheduled_for),
    takenAt: row.taken_at == null ? null : Number(row.taken_at),
    skipped: Boolean(row.skipped),
    amount: Number(row.amount),
    unit: row.unit,
    notes: row.notes ?? null,
  };
}

export function exercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    archived: Boolean(row.archived),
    isPreset: Boolean(row.is_preset),
  };
}

export function session(row: any): WorkoutSession {
  return {
    id: row.id,
    startedAt: Number(row.started_at),
    finishedAt: row.finished_at == null ? null : Number(row.finished_at),
    notes: row.notes ?? null,
  };
}

export function setRow(row: any): WorkoutSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setIndex: Number(row.set_index),
    reps: Number(row.reps),
    weightKg: Number(row.weight_kg),
    completed: Boolean(row.completed),
  };
}

export function weight(row: any): BodyWeight {
  return {
    id: row.id,
    weightKg: Number(row.weight_kg),
    loggedAt: Number(row.logged_at),
    notes: row.notes ?? null,
  };
}

export function photo(row: any): ProgressPhoto {
  return {
    id: row.id,
    localUri: row.local_uri,
    pose: row.pose,
    takenAt: Number(row.taken_at),
    notes: row.notes ?? null,
  };
}

export function throwIf(error: { message: string } | null, fallback = 'Database error') {
  if (error) throw new Error(error.message || fallback);
}
