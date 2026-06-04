import type { SQLiteDatabase } from 'expo-sqlite';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { Observation, ObservationWithTags, TagDefinition, DaySummary } from '../../types/database';

export async function insertQuickTapObservation(
  db: SQLiteDatabase,
  childId: string,
  userId: string,
  tag: TagDefinition
): Promise<string> {
  const id = generateUUID();
  const now = nowISO();

  await db.runAsync(
    `INSERT INTO observations (id, child_id, created_by, occurred_at, entry_type, category, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'quick_tap', ?, ?, ?, ?)`,
    [id, childId, userId, now, tag.category, tag.name, now, now]
  );

  await db.runAsync(
    `INSERT INTO observation_tags (observation_id, tag_id) VALUES (?, ?)`,
    [id, tag.id]
  );

  return id;
}

export async function getObservationsByDate(
  db: SQLiteDatabase,
  childId: string,
  date: string
): Promise<ObservationWithTags[]> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const observations = await db.getAllAsync<Observation>(
    `SELECT * FROM observations
     WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0
     ORDER BY occurred_at DESC`,
    [childId, startOfDay, endOfDay]
  );

  const result: ObservationWithTags[] = [];
  for (const obs of observations) {
    const tags = await db.getAllAsync<TagDefinition>(
      `SELECT td.* FROM tag_definitions td
       JOIN observation_tags ot ON ot.tag_id = td.id
       WHERE ot.observation_id = ?`,
      [obs.id]
    );
    result.push({ ...obs, tags });
  }

  return result;
}

export async function softDeleteObservation(
  db: SQLiteDatabase,
  observationId: string
): Promise<void> {
  await db.runAsync(
    `UPDATE observations SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [nowISO(), observationId]
  );
}

export async function undoDeleteObservation(
  db: SQLiteDatabase,
  observationId: string
): Promise<void> {
  await db.runAsync(
    `UPDATE observations SET is_deleted = 0, updated_at = ? WHERE id = ?`,
    [nowISO(), observationId]
  );
}

export async function getDaySummary(
  db: SQLiteDatabase,
  childId: string,
  date: string
): Promise<DaySummary> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const counts = await db.getFirstAsync<{
    sleep: number;
    meals: number;
    meds: number;
    incidents: number;
  }>(
    `SELECT
       SUM(CASE WHEN category = 'sleep' THEN 1 ELSE 0 END) as sleep,
       SUM(CASE WHEN category = 'food' THEN 1 ELSE 0 END) as meals,
       SUM(CASE WHEN category = 'medication' THEN 1 ELSE 0 END) as meds,
       SUM(CASE WHEN entry_type = 'incident' OR category = 'behavior' THEN 1 ELSE 0 END) as incidents
     FROM observations
     WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0`,
    [childId, startOfDay, endOfDay]
  );

  return {
    sleep: counts?.sleep ?? 0,
    meals: counts?.meals ?? 0,
    meds: counts?.meds ?? 0,
    incidents: counts?.incidents ?? 0,
  };
}
