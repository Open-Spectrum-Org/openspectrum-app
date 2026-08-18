import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { DailyReflection } from '../../types/database';

export async function upsertReflection(
  childId: string,
  userId: string,
  date: string,
  rating: 'better_than_usual' | 'typical' | 'difficult'
): Promise<void> {
  const existing = await getReflection(childId, date);
  const now = nowISO();

  if (existing) {
    await db.daily_reflections.update(existing.id, {
      rating,
      updated_at: now,
    });
  } else {
    await db.daily_reflections.put({
      id: generateUUID(),
      child_id: childId,
      created_by: userId,
      reflection_date: date,
      rating,
      notes: null,
      created_at: now,
      updated_at: now,
      is_deleted: 0,
      sync_status: 'pending',
      last_synced_at: null,
      device_id: null,
      version: 1,
    });
  }
}

export async function getReflection(
  childId: string,
  date: string
): Promise<DailyReflection | undefined> {
  return db.daily_reflections
    .where('[child_id+reflection_date]')
    .equals([childId, date])
    .filter((r) => r.is_deleted === 0)
    .first();
}
