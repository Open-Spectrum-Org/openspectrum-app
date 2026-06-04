import type { SQLiteDatabase } from 'expo-sqlite';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { DailyReflection } from '../../types/database';

export async function upsertReflection(
  db: SQLiteDatabase,
  childId: string,
  userId: string,
  date: string,
  rating: 'better_than_usual' | 'typical' | 'difficult'
): Promise<void> {
  const existing = await getReflection(db, childId, date);
  const now = nowISO();

  if (existing) {
    await db.runAsync(
      `UPDATE daily_reflections SET rating = ?, updated_at = ? WHERE id = ?`,
      [rating, now, existing.id]
    );
  } else {
    await db.runAsync(
      `INSERT INTO daily_reflections (id, child_id, created_by, reflection_date, rating, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateUUID(), childId, userId, date, rating, now, now]
    );
  }
}

export async function getReflection(
  db: SQLiteDatabase,
  childId: string,
  date: string
): Promise<DailyReflection | null> {
  return db.getFirstAsync<DailyReflection>(
    `SELECT * FROM daily_reflections WHERE child_id = ? AND reflection_date = ? AND is_deleted = 0`,
    [childId, date]
  );
}
