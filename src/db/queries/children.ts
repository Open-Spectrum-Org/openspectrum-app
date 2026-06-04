import type { SQLiteDatabase } from 'expo-sqlite';
import type { Child } from '../../types/database';

export async function getChildrenForFamily(
  db: SQLiteDatabase,
  familyId: string
): Promise<Child[]> {
  return db.getAllAsync<Child>(
    `SELECT * FROM children WHERE family_id = ? AND is_deleted = 0 ORDER BY display_name`,
    [familyId]
  );
}

export async function getChildById(
  db: SQLiteDatabase,
  childId: string
): Promise<Child | null> {
  return db.getFirstAsync<Child>(
    `SELECT * FROM children WHERE id = ? AND is_deleted = 0`,
    [childId]
  );
}
