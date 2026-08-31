import type { SQLiteDatabase } from 'expo-sqlite';

export type SqlExecutor = {
  exec: (sql: string) => void;
  getUserVersion: () => number;
};

const MIGRATION_1 = [
  `CREATE TABLE IF NOT EXISTS supplements (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    form TEXT NOT NULL,
    default_amount REAL NOT NULL,
    default_unit TEXT NOT NULL,
    color TEXT NOT NULL,
    notes TEXT,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS supplements_archived_idx ON supplements (archived)`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY NOT NULL,
    supplement_id TEXT NOT NULL,
    time_minutes INTEGER NOT NULL,
    frequency TEXT NOT NULL,
    interval_days INTEGER,
    weekdays_mask INTEGER,
    cycle_on_days INTEGER,
    cycle_off_days INTEGER,
    reminder_enabled INTEGER NOT NULL DEFAULT 1,
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    active INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE INDEX IF NOT EXISTS schedules_supplement_idx ON schedules (supplement_id)`,
  `CREATE TABLE IF NOT EXISTS dose_logs (
    id TEXT PRIMARY KEY NOT NULL,
    supplement_id TEXT NOT NULL,
    schedule_id TEXT,
    scheduled_for INTEGER NOT NULL,
    taken_at INTEGER,
    skipped INTEGER NOT NULL DEFAULT 0,
    amount REAL NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS dose_logs_scheduled_idx ON dose_logs (scheduled_for)`,
  `CREATE INDEX IF NOT EXISTS dose_logs_supplement_idx ON dose_logs (supplement_id, scheduled_for)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS dose_logs_schedule_time_uidx ON dose_logs (schedule_id, scheduled_for)`,
  `CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    is_preset INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    notes TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS workout_sessions_started_idx ON workout_sessions (started_at)`,
  `CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_index INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE INDEX IF NOT EXISTS workout_sets_session_idx ON workout_sets (session_id)`,
  `CREATE INDEX IF NOT EXISTS workout_sets_exercise_idx ON workout_sets (exercise_id)`,
  `CREATE TABLE IF NOT EXISTS body_weights (
    id TEXT PRIMARY KEY NOT NULL,
    logged_at INTEGER NOT NULL,
    weight_kg REAL NOT NULL,
    notes TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS body_weights_logged_idx ON body_weights (logged_at)`,
  `CREATE TABLE IF NOT EXISTS progress_photos (
    id TEXT PRIMARY KEY NOT NULL,
    taken_at INTEGER NOT NULL,
    local_uri TEXT NOT NULL,
    pose TEXT NOT NULL,
    notes TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS progress_photos_taken_idx ON progress_photos (taken_at)`,
];

const MIGRATIONS: { version: number; statements: string[] }[] = [
  { version: 1, statements: MIGRATION_1 },
];

export function applySqlMigrations(executor: SqlExecutor) {
  executor.exec('PRAGMA foreign_keys = ON;');
  let current = executor.getUserVersion();

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;

    executor.exec('BEGIN');
    try {
      for (const statement of migration.statements) {
        executor.exec(statement);
      }
      executor.exec(`PRAGMA user_version = ${migration.version}`);
      executor.exec('COMMIT');
      current = migration.version;
    } catch (error) {
      executor.exec('ROLLBACK');
      throw error;
    }
  }
}

export function migrate(database: SQLiteDatabase) {
  try {
    database.execSync('PRAGMA journal_mode = WAL;');
  } catch {
    // WAL is not available on every web backend
  }

  applySqlMigrations({
    exec: (sql) => database.execSync(sql),
    getUserVersion: () =>
      database.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0,
  });
}
