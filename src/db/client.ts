import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { notifyDbChanged } from '@/db/events';
import { migrate } from '@/db/migrate';
import { createPendingDb } from '@/db/pending';
import { schema } from '@/db/schema';
import { seedExercises } from '@/db/seed';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

let sqlite: SQLiteDatabase | null = null;
let db: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!db) return createPendingDb() as AppDatabase;
  return db;
}

export async function initDatabase() {
  if (db) return db;

  sqlite = openDatabaseSync('pillio.db', { enableChangeListener: true });
  migrate(sqlite);
  db = drizzle(sqlite, { schema });
  seedExercises(db);
  notifyDbChanged();
  return db;
}

export async function flushLocalPersist() {
  // expo-sqlite writes are immediate
}
