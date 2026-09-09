import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { FocusArea, ObservationFocusArea } from '../../types/database';

export async function getFocusAreasByChild(childId: string): Promise<FocusArea[]> {
  return db.focus_areas
    .where('child_id')
    .equals(childId)
    .filter((fa) => fa.is_deleted === 0)
    .toArray();
}

export async function getActiveFocusAreas(childId: string): Promise<FocusArea[]> {
  return db.focus_areas
    .where('child_id')
    .equals(childId)
    .filter((fa) => fa.is_deleted === 0 && fa.status === 'active')
    .toArray();
}

export async function insertFocusArea(
  area: Omit<FocusArea, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'sync_status' | 'last_synced_at' | 'device_id' | 'version'>
): Promise<string> {
  const id = generateUUID();
  const now = nowISO();
  await db.focus_areas.put({
    ...area,
    id,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  });
  return id;
}

export async function updateFocusArea(
  id: string,
  fields: Partial<Pick<FocusArea, 'title' | 'description' | 'status' | 'related_categories' | 'related_tag_ids' | 'questions'>>
): Promise<void> {
  await db.focus_areas.update(id, { ...fields, updated_at: nowISO() });
}

export async function updateFocusAreaStatus(
  focusAreaId: string,
  status: FocusArea['status']
): Promise<void> {
  await db.focus_areas.update(focusAreaId, {
    status,
    updated_at: nowISO(),
  });
}

export async function softDeleteFocusArea(focusAreaId: string): Promise<void> {
  await db.focus_areas.update(focusAreaId, {
    is_deleted: 1,
    updated_at: nowISO(),
  });
}

export async function getFocusAreasForObservation(
  observationId: string
): Promise<ObservationFocusArea[]> {
  return db.observation_focus_areas
    .where('observation_id')
    .equals(observationId)
    .toArray();
}

export async function linkObservationToFocusArea(
  observationId: string,
  focusAreaId: string,
  linkType: 'explicit' | 'derived'
): Promise<void> {
  await db.observation_focus_areas.put({
    observation_id: observationId,
    focus_area_id: focusAreaId,
    link_type: linkType,
    created_at: nowISO(),
  });
}

export async function unlinkObservationFromFocusArea(
  observationId: string,
  focusAreaId: string
): Promise<void> {
  await db.observation_focus_areas
    .where('[observation_id+focus_area_id]')
    .equals([observationId, focusAreaId])
    .delete();
}

/** Batch-load focus area IDs linked to a set of observations. */
export async function getLinkedFocusAreaIdsForObservations(
  obsIds: string[]
): Promise<Record<string, string[]>> {
  if (obsIds.length === 0) return {};
  const links = await db.observation_focus_areas
    .where('observation_id')
    .anyOf(obsIds)
    .toArray();
  const result: Record<string, string[]> = {};
  for (const link of links) {
    (result[link.observation_id] ??= []).push(link.focus_area_id);
  }
  return result;
}
