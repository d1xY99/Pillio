import { drizzle, type SQLJsDatabase } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';

import { notifyDbChanged } from '@/db/events';
import { applySqlMigrations } from '@/db/migrate';
import { createPendingDb } from '@/db/pending';
import { schema } from '@/db/schema';
import { seedExercises } from '@/db/seed';

export type AppDatabase = SQLJsDatabase<typeof schema>;

const IDB_NAME = 'pillio';
const IDB_STORE = 'sqlite';
const IDB_KEY = 'pillio.db';

let sqlDb: any = null;
let db: AppDatabase | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function getDb(): AppDatabase {
  if (!db) return createPendingDb() as AppDatabase;
  return db;
}

export async function initDatabase() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `/${file}`,
  });

  const saved = await readIdb();
  sqlDb = saved ? new SQL.Database(saved) : new SQL.Database();
  instrumentSqlJs(sqlDb);

  applySqlMigrations({
    exec: (sql) => {
      sqlDb!.run(sql);
    },
    getUserVersion: () => {
      const result = sqlDb!.exec('PRAGMA user_version');
      return Number(result[0]?.values?.[0]?.[0] ?? 0);
    },
  });

  db = drizzle(sqlDb, { schema });
  seedExercises(db);
  await persistNow();
  notifyDbChanged();
  return db;
}

function instrumentSqlJs(database: NonNullable<typeof sqlDb>) {
  const originalRun = database.run.bind(database);
  database.run = ((sql: string, params?: unknown) => {
    const result = params ? originalRun(sql, params as never) : originalRun(sql);
    queuePersist();
    return result;
  }) as typeof database.run;

  const originalExec = database.exec.bind(database);
  database.exec = ((sql: string, params?: unknown) => {
    const result = params ? originalExec(sql, params as never) : originalExec(sql);
    if (/\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|REPLACE)\b/i.test(sql)) {
      queuePersist();
    }
    return result;
  }) as typeof database.exec;

  const originalPrepare = database.prepare.bind(database);
  database.prepare = ((sql: string) => {
    const statement = originalPrepare(sql);
    const originalStep = statement.step.bind(statement);
    statement.step = () => {
      const changed = originalStep();
      if (/\b(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql)) {
        queuePersist();
      }
      return changed;
    };
    return statement;
  }) as typeof database.prepare;
}

function queuePersist() {
  notifyDbChanged();
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persistNow();
  }, 200);
}

async function persistNow() {
  if (!sqlDb || typeof indexedDB === 'undefined') return;
  const bytes = sqlDb.export();
  await writeIdb(bytes);
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IDB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIdb(): Promise<Uint8Array | null> {
  if (typeof indexedDB === 'undefined') return null;
  const database = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(IDB_STORE, 'readonly');
    const request = tx.objectStore(IDB_STORE).get(IDB_KEY);
    request.onsuccess = () => {
      const value = request.result as Uint8Array | undefined;
      resolve(value ?? null);
    };
    request.onerror = () => reject(request.error);
  });
}

async function writeIdb(bytes: Uint8Array) {
  const database = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void persistNow();
    }
  });
}
