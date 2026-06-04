import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';
import { seedDatabase } from './seed';

const DB_NAME = 'openspectrum.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode and foreign keys
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables
  await db.execAsync(SCHEMA_SQL);

  // Seed with test data
  await seedDatabase(db);

  dbInstance = db;
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
