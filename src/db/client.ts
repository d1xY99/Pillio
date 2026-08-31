import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from '@/db/migrate';
import { schema } from '@/db/schema';
import { seedExercises } from '@/db/seed';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

let sqlite: SQLiteDatabase | null = null;
let db: AppDatabase | null = null;

export function getDb(): AppDatabase {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function initDatabase() {
  if (db) return db;

  sqlite = openDatabaseSync('pillio.db', { enableChangeListener: true });
  migrate(sqlite);
  db = drizzle(sqlite, { schema });
  seedExercises(db);
  return db;
}
