import type { SQLiteDatabase } from 'expo-sqlite';

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface TagCount {
  name: string;
  category: string;
  count: number;
}

export interface HourCount {
  hour: number;
  count: number;
}

export interface ReflectionCount {
  rating: string;
  count: number;
}

export interface CategoryReflectionCorrelation {
  rating: string;
  avgObservations: number;
}

/** Total observations per category in a date range */
export async function getCategoryBreakdown(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string
): Promise<CategoryCount[]> {
  return db.getAllAsync<CategoryCount>(
    `SELECT category, COUNT(*) as count
     FROM observations
     WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0
     GROUP BY category
     ORDER BY count DESC`,
    [childId, `${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`]
  );
}

/** Total observations per day in a date range */
export async function getDailyCounts(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string
): Promise<DailyCount[]> {
  return db.getAllAsync<DailyCount>(
    `SELECT DATE(occurred_at) as date, COUNT(*) as count
     FROM observations
     WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0
     GROUP BY DATE(occurred_at)
     ORDER BY date ASC`,
    [childId, `${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`]
  );
}

/** Top tags used in a date range */
export async function getTopTags(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string,
  limit = 10
): Promise<TagCount[]> {
  return db.getAllAsync<TagCount>(
    `SELECT td.name, td.category, COUNT(*) as count
     FROM observation_tags ot
     JOIN tag_definitions td ON td.id = ot.tag_id
     JOIN observations o ON o.id = ot.observation_id
     WHERE o.child_id = ? AND o.occurred_at >= ? AND o.occurred_at <= ? AND o.is_deleted = 0
     GROUP BY td.id
     ORDER BY count DESC
     LIMIT ?`,
    [childId, `${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`, limit]
  );
}

/** Total observation count in a date range */
export async function getTotalCount(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM observations
     WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0`,
    [childId, `${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`]
  );
  return row?.count ?? 0;
}

/** Observations grouped by hour of day */
export async function getHourlyDistribution(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string
): Promise<HourCount[]> {
  return db.getAllAsync<HourCount>(
    `SELECT CAST(strftime('%H', occurred_at) AS INTEGER) as hour, COUNT(*) as count
     FROM observations
     WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0
     GROUP BY hour
     ORDER BY hour ASC`,
    [childId, `${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`]
  );
}

/** Reflection ratings summary in a date range */
export async function getReflectionSummary(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string
): Promise<ReflectionCount[]> {
  return db.getAllAsync<ReflectionCount>(
    `SELECT rating, COUNT(*) as count
     FROM daily_reflections
     WHERE child_id = ? AND reflection_date >= ? AND reflection_date <= ? AND is_deleted = 0
     GROUP BY rating
     ORDER BY count DESC`,
    [childId, startDate, endDate]
  );
}

/** Average observations per day grouped by reflection rating */
export async function getReflectionCorrelation(
  db: SQLiteDatabase,
  childId: string,
  startDate: string,
  endDate: string
): Promise<CategoryReflectionCorrelation[]> {
  return db.getAllAsync<CategoryReflectionCorrelation>(
    `SELECT dr.rating, ROUND(AVG(day_counts.cnt), 1) as avgObservations
     FROM daily_reflections dr
     JOIN (
       SELECT DATE(occurred_at) as d, COUNT(*) as cnt
       FROM observations
       WHERE child_id = ? AND occurred_at >= ? AND occurred_at <= ? AND is_deleted = 0
       GROUP BY DATE(occurred_at)
     ) day_counts ON day_counts.d = dr.reflection_date
     WHERE dr.child_id = ? AND dr.reflection_date >= ? AND dr.reflection_date <= ? AND dr.is_deleted = 0
     GROUP BY dr.rating`,
    [
      childId, `${startDate}T00:00:00.000Z`, `${endDate}T23:59:59.999Z`,
      childId, startDate, endDate,
    ]
  );
}
