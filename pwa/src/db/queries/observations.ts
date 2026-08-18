import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { ObservationWithTags, TagDefinition, DaySummary } from '../../types/database';

export async function insertQuickTapObservation(
  childId: string,
  userId: string,
  tag: TagDefinition
): Promise<string> {
  const id = generateUUID();
  const now = nowISO();

  await db.observations.put({
    id,
    child_id: childId,
    created_by: userId,
    occurred_at: now,
    entry_type: 'quick_tap',
    category: tag.category,
    title: tag.name,
    notes: null,
    incident_data: null,
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

  const result: ObservationWithTags[] = [];
  for (const obs of observations) {
    const otags = await db.observation_tags
      .where('observation_id')
      .equals(obs.id)
      .toArray();

    const tagIds = otags.map((ot) => ot.tag_id);
    const tags = (await db.tag_definitions.bulkGet(tagIds)).filter(
      (t): t is TagDefinition => t !== undefined
    );

    result.push({ ...obs, tags });
  }

  return result;
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
