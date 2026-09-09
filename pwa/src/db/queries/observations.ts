import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import { getAssessmentsForObservations } from './assessments';
import type { ObservationWithTags, TagDefinition, DaySummary, Observation } from '../../types/database';

export async function insertQuickTapObservation(
  childId: string,
  userId: string,
  tag: TagDefinition,
  options?: { occurredAt?: string; precision?: Observation['event_time_precision'] }
): Promise<string> {
  const id = generateUUID();
  const now = nowISO();

  await db.observations.put({
    id,
    child_id: childId,
    created_by: userId,
    occurred_at: options?.occurredAt ?? now,
    event_time_precision: options?.precision ?? 'exact',
    event_end_at: null,
    event_timezone: null,
    entry_type: 'quick_tap',
    category: tag.category,
    title: tag.name,
    notes: null,
    duration_minutes: null,
    quantity: null,
    severity: null,
    confidence: null,
    context_data: null,
    event_data: null,
    data_layer: 'raw',
    visibility_level: 'family',
    is_partial: 0,
    voice_log_id: null,
    parent_observation_id: null,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  });

  await db.observation_tags.put({
    observation_id: id,
    tag_id: tag.id,
  });

  return id;
}

async function attachTagsAndAssessments(observations: Observation[]): Promise<ObservationWithTags[]> {
  if (observations.length === 0) return [];

  const ids = observations.map((o) => o.id);

  // Bulk-load all observation_tags for these observations
  const allOTags = await db.observation_tags
    .where('observation_id')
    .anyOf(ids)
    .toArray();

  // Bulk-load all tag definitions
  const tagIds = [...new Set(allOTags.map((ot) => ot.tag_id))];
  const tagDefs = (await db.tag_definitions.bulkGet(tagIds)).filter(
    (t): t is TagDefinition => t !== undefined
  );
  const tagMap = new Map(tagDefs.map((t) => [t.id, t]));

  // Group tags by observation
  const obsTags: Record<string, TagDefinition[]> = {};
  for (const ot of allOTags) {
    const tag = tagMap.get(ot.tag_id);
    if (!tag) continue;
    if (!obsTags[ot.observation_id]) obsTags[ot.observation_id] = [];
    obsTags[ot.observation_id]!.push(tag);
  }

  // Bulk-load assessments
  const assessmentMap = await getAssessmentsForObservations(ids);

  return observations.map((obs) => ({
    ...obs,
    tags: obsTags[obs.id] ?? [],
    assessments: assessmentMap[obs.id] ?? [],
  }));
}

export async function getObservationsByDate(
  childId: string,
  date: string
): Promise<ObservationWithTags[]> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const observations = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, startOfDay], [childId, endOfDay], true, true)
    .filter((o) => o.is_deleted === 0)
    .reverse()
    .toArray();

  return attachTagsAndAssessments(observations);
}

export async function getObservationsByDateRange(
  childId: string,
  startDate: string,
  endDate: string
): Promise<ObservationWithTags[]> {
  const start = `${startDate}T00:00:00.000Z`;
  const end = `${endDate}T23:59:59.999Z`;

  const observations = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, start], [childId, end], true, true)
    .filter((o) => o.is_deleted === 0)
    .reverse()
    .toArray();

  return attachTagsAndAssessments(observations);
}

export async function softDeleteObservation(observationId: string): Promise<void> {
  await db.observations.update(observationId, {
    is_deleted: 1,
    updated_at: nowISO(),
  });
}

export async function undoDeleteObservation(observationId: string): Promise<void> {
  await db.observations.update(observationId, {
    is_deleted: 0,
    updated_at: nowISO(),
  });
}

export async function getDaySummary(childId: string, date: string): Promise<DaySummary> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const observations = await db.observations
    .where('[child_id+occurred_at]')
    .between([childId, startOfDay], [childId, endOfDay], true, true)
    .filter((o) => o.is_deleted === 0)
    .toArray();

  const summary: DaySummary = { behavior: 0, emotion: 0, food: 0, medication: 0 };
  for (const obs of observations) {
    if (obs.category === 'behavior') summary.behavior++;
    else if (obs.category === 'emotion') summary.emotion++;
    else if (obs.category === 'food') summary.food++;
    else if (obs.category === 'medication') summary.medication++;
  }

  return summary;
}
