import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const supplements = sqliteTable(
  'supplements',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    form: text('form').notNull(),
    defaultAmount: real('default_amount').notNull(),
    defaultUnit: text('default_unit').notNull(),
    color: text('color').notNull(),
    notes: text('notes'),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('supplements_archived_idx').on(table.archived)],
);

export const schedules = sqliteTable(
  'schedules',
  {
    id: text('id').primaryKey(),
    supplementId: text('supplement_id').notNull(),
    timeMinutes: integer('time_minutes').notNull(),
    frequency: text('frequency').notNull(),
    intervalDays: integer('interval_days'),
    weekdaysMask: integer('weekdays_mask'),
    cycleOnDays: integer('cycle_on_days'),
    cycleOffDays: integer('cycle_off_days'),
    reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).notNull().default(true),
    startDate: integer('start_date').notNull(),
    endDate: integer('end_date'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [index('schedules_supplement_idx').on(table.supplementId)],
);

export const doseLogs = sqliteTable(
  'dose_logs',
  {
    id: text('id').primaryKey(),
    supplementId: text('supplement_id').notNull(),
    scheduleId: text('schedule_id'),
    scheduledFor: integer('scheduled_for').notNull(),
    takenAt: integer('taken_at'),
    skipped: integer('skipped', { mode: 'boolean' }).notNull().default(false),
    amount: real('amount').notNull(),
    unit: text('unit').notNull(),
    notes: text('notes'),
  },
  (table) => [
    index('dose_logs_scheduled_idx').on(table.scheduledFor),
    index('dose_logs_supplement_idx').on(table.supplementId, table.scheduledFor),
    uniqueIndex('dose_logs_schedule_time_uidx').on(table.scheduleId, table.scheduledFor),
  ],
);

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  isPreset: integer('is_preset', { mode: 'boolean' }).notNull().default(false),
});

export const workoutSessions = sqliteTable(
  'workout_sessions',
  {
    id: text('id').primaryKey(),
    startedAt: integer('started_at').notNull(),
    finishedAt: integer('finished_at'),
    notes: text('notes'),
  },
  (table) => [index('workout_sessions_started_idx').on(table.startedAt)],
);

export const workoutSets = sqliteTable(
  'workout_sets',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id').notNull(),
    exerciseId: text('exercise_id').notNull(),
    setIndex: integer('set_index').notNull(),
    reps: integer('reps').notNull(),
    weightKg: real('weight_kg').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    index('workout_sets_session_idx').on(table.sessionId),
    index('workout_sets_exercise_idx').on(table.exerciseId),
  ],
);

export const bodyWeights = sqliteTable(
  'body_weights',
  {
    id: text('id').primaryKey(),
    loggedAt: integer('logged_at').notNull(),
    weightKg: real('weight_kg').notNull(),
    notes: text('notes'),
  },
  (table) => [index('body_weights_logged_idx').on(table.loggedAt)],
);

export const habits = sqliteTable(
  'habits',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    emoji: text('emoji').notNull(),
    color: text('color').notNull(),
    category: text('category').notNull(),
    notes: text('notes'),
    frequency: text('frequency').notNull(),
    weekdaysMask: integer('weekdays_mask'),
    timesPerDay: integer('times_per_day').notNull().default(1),
    reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).notNull().default(true),
    reminderMinutes: integer('reminder_minutes').notNull().default(540),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('habits_archived_idx').on(table.archived)],
);

export const habitLogs = sqliteTable(
  'habit_logs',
  {
    id: text('id').primaryKey(),
    habitId: text('habit_id').notNull(),
    scheduledFor: integer('scheduled_for').notNull(),
    occurrence: integer('occurrence').notNull().default(0),
    takenAt: integer('taken_at'),
    skipped: integer('skipped', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [
    index('habit_logs_scheduled_idx').on(table.scheduledFor),
    uniqueIndex('habit_logs_habit_occ_uidx').on(table.habitId, table.scheduledFor, table.occurrence),
  ],
);

export const progressPhotos = sqliteTable(
  'progress_photos',
  {
    id: text('id').primaryKey(),
    takenAt: integer('taken_at').notNull(),
    localUri: text('local_uri').notNull(),
    pose: text('pose').notNull(),
    notes: text('notes'),
  },
  (table) => [index('progress_photos_taken_idx').on(table.takenAt)],
);

export const schema = {
  supplements,
  schedules,
  doseLogs,
  exercises,
  workoutSessions,
  workoutSets,
  bodyWeights,
  progressPhotos,
  habits,
  habitLogs,
};

export type Supplement = typeof supplements.$inferSelect;
export type NewSupplement = typeof supplements.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type DoseLog = typeof doseLogs.$inferSelect;
export type NewDoseLog = typeof doseLogs.$inferInsert;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type BodyWeight = typeof bodyWeights.$inferSelect;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
