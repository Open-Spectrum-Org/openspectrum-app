import { db } from '../database';
import type { AssessmentScale } from '../../types/database';

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
  childId: string,
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<CategoryCount[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .toArray();

  const counts = new Map<string, number>();
  for (const o of obs) {
    counts.set(o.category, (counts.get(o.category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Total observations per day in a date range */
export async function getDailyCounts(
  childId: string,
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<DailyCount[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .toArray();

  const counts = new Map<string, number>();
  for (const o of obs) {
    const date = o.occurred_at.split('T')[0]!;
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Top tags used in a date range */
export async function getTopTags(
  childId: string,
  startDate: string,
  endDate: string,
  limit = 10,
  categories?: string[]
): Promise<TagCount[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .toArray();

  const obsIds = new Set(obs.map((o) => o.id));

  const allOTags = await db.observation_tags.toArray();
  const relevantOTags = allOTags.filter((ot) => obsIds.has(ot.observation_id));

  const tagCounts = new Map<string, number>();
  for (const ot of relevantOTags) {
    tagCounts.set(ot.tag_id, (tagCounts.get(ot.tag_id) ?? 0) + 1);
  }

  const tagIds = Array.from(tagCounts.keys());
  const tags = await db.tag_definitions.bulkGet(tagIds);

  const result: TagCount[] = [];
  for (const [tagId, count] of tagCounts) {
    const tag = tags.find((t) => t?.id === tagId);
    if (tag) {
      result.push({ name: tag.name, category: tag.category, count });
    }
  }

  return result.sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Total observation count in a date range */
export async function getTotalCount(
  childId: string,
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<number> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  return db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .count();
}

/** Observations grouped by hour of day */
export async function getHourlyDistribution(
  childId: string,
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<HourCount[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .toArray();

  const counts = new Map<number, number>();
  for (const o of obs) {
    const hour = new Date(o.occurred_at).getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);
}

/** Reflection ratings summary in a date range */
export async function getReflectionSummary(
  childId: string,
  startDate: string,
  endDate: string
): Promise<ReflectionCount[]> {
  const reflections = await db.daily_reflections
    .where('child_id')
    .equals(childId)
    .filter(
      (r) =>
        r.is_deleted === 0 &&
        r.reflection_date >= startDate &&
        r.reflection_date <= endDate
    )
    .toArray();

  const counts = new Map<string, number>();
  for (const r of reflections) {
    counts.set(r.rating, (counts.get(r.rating) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => b.count - a.count);
}

/** Average observations per day grouped by reflection rating */
export async function getReflectionCorrelation(
  childId: string,
  startDate: string,
  endDate: string
): Promise<CategoryReflectionCorrelation[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  // Get daily observation counts
  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0)
    .toArray();

  const dailyObsCounts = new Map<string, number>();
  for (const o of obs) {
    const date = o.occurred_at.split('T')[0]!;
    dailyObsCounts.set(date, (dailyObsCounts.get(date) ?? 0) + 1);
  }

  // Get reflections
  const reflections = await db.daily_reflections
    .where('child_id')
    .equals(childId)
    .filter(
      (r) =>
        r.is_deleted === 0 &&
        r.reflection_date >= startDate &&
        r.reflection_date <= endDate
    )
    .toArray();

  // Group by rating
  const ratingGroups = new Map<string, number[]>();
  for (const r of reflections) {
    const obsCount = dailyObsCounts.get(r.reflection_date) ?? 0;
    const group = ratingGroups.get(r.rating) ?? [];
    group.push(obsCount);
    ratingGroups.set(r.rating, group);
  }

  return Array.from(ratingGroups.entries()).map(([rating, counts]) => ({
    rating,
    avgObservations:
      Math.round((counts.reduce((s, c) => s + c, 0) / counts.length) * 10) / 10,
  }));
}

// ─── Phase 5: Intelligence ───────────────────────────────────────────────────

export interface AssessmentAverage {
  scaleId: string;
  scaleName: string;
  scaleType: 'numeric' | 'categorical';
  avg: number | null;
  maxValue: number | null;
  count: number;
  distribution: Record<string, number>;
}

/** Average numeric scores and categorical distributions for observation assessments in a date range */
export async function getAssessmentAverages(
  childId: string,
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<AssessmentAverage[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .toArray();

  if (obs.length === 0) return [];

  const obsIds = obs.map((o) => o.id);
  const assessments = await db.observation_assessments
    .where('observation_id')
    .anyOf(obsIds)
    .toArray();

  if (assessments.length === 0) return [];

  const scaleIds = [...new Set(assessments.map((a) => a.scale_id))];
  const scales = (await db.assessment_scales.bulkGet(scaleIds)).filter(
    (s): s is AssessmentScale => s !== undefined
  );
  const scaleMap = new Map(scales.map((s) => [s.id, s]));

  const byScale = new Map<string, { numerics: number[]; categoricals: string[] }>();
  for (const a of assessments) {
    if (!byScale.has(a.scale_id)) byScale.set(a.scale_id, { numerics: [], categoricals: [] });
    const group = byScale.get(a.scale_id)!;
    if (a.numeric_value !== null) group.numerics.push(a.numeric_value);
    if (a.categorical_value !== null) group.categoricals.push(a.categorical_value);
  }

  const result: AssessmentAverage[] = [];
  for (const [scaleId, group] of byScale) {
    const scale = scaleMap.get(scaleId);
    if (!scale) continue;

    const isNumeric = scale.scale_type === 'numeric';
    const count = isNumeric ? group.numerics.length : group.categoricals.length;
    if (count === 0) continue;

    let avg: number | null = null;
    if (isNumeric && group.numerics.length > 0) {
      const sum = group.numerics.reduce((s, v) => s + v, 0);
      avg = Math.round((sum / group.numerics.length) * 10) / 10;
    }

    const distribution: Record<string, number> = {};
    for (const val of group.categoricals) {
      distribution[val] = (distribution[val] ?? 0) + 1;
    }

    result.push({
      scaleId,
      scaleName: scale.name,
      scaleType: scale.scale_type,
      avg,
      maxValue: scale.max_value,
      count,
      distribution,
    });
  }

  return result.sort((a, b) => b.count - a.count);
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface DayOfWeekCount {
  dayIndex: number;
  dayLabel: string;
  count: number;
}

/** Observation count grouped by day of week (0 = Sunday) for a date range */
export async function getDayOfWeekPattern(
  childId: string,
  startDate: string,
  endDate: string,
  categories?: string[]
): Promise<DayOfWeekCount[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const obs = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0 && (!categories || categories.includes(o.category)))
    .toArray();

  const counts = new Map<number, number>();
  for (const o of obs) {
    const dow = new Date(o.occurred_at).getDay();
    counts.set(dow, (counts.get(dow) ?? 0) + 1);
  }

  return [0, 1, 2, 3, 4, 5, 6].map((i) => ({
    dayIndex: i,
    dayLabel: DAY_LABELS[i]!,
    count: counts.get(i) ?? 0,
  }));
}
