import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { AssessmentScale, AssessmentWithScale, ObservationAssessment } from '../../types/database';

export async function getSystemScales(): Promise<AssessmentScale[]> {
  return db.assessment_scales
    .where('is_system')
    .equals(1)
    .filter((s) => s.is_deleted === 0)
    .toArray();
}

export async function getScalesForCategory(category: string): Promise<AssessmentScale[]> {
  const all = await db.assessment_scales
    .filter((s) => s.is_deleted === 0)
    .toArray();

  return all.filter((s) => {
    if (!s.applies_to_categories) return false;
    try {
      const cats: string[] = JSON.parse(s.applies_to_categories);
      return cats.includes(category);
    } catch {
      return false;
    }
  });
}

export async function insertAssessmentScale(
  scale: Omit<AssessmentScale, 'id' | 'created_at' | 'is_deleted' | 'sync_status' | 'last_synced_at' | 'device_id' | 'version'>
): Promise<string> {
  const id = generateUUID();
  await db.assessment_scales.put({
    ...scale,
    id,
    created_at: nowISO(),
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  });
  return id;
}

export async function getAssessmentsForObservation(
  observationId: string
): Promise<ObservationAssessment[]> {
  return db.observation_assessments
    .where('observation_id')
    .equals(observationId)
    .toArray();
}

export async function insertObservationAssessment(
  observationId: string,
  scaleId: string,
  values: {
    numeric_value?: number | null;
    categorical_value?: string | null;
    comparative_value?: 'better' | 'same' | 'worse' | null;
  }
): Promise<string> {
  const id = generateUUID();
  await db.observation_assessments.put({
    id,
    observation_id: observationId,
    scale_id: scaleId,
    numeric_value: values.numeric_value ?? null,
    categorical_value: values.categorical_value ?? null,
    comparative_value: values.comparative_value ?? null,
    created_at: nowISO(),
  });
  return id;
}

export async function deleteObservationAssessment(assessmentId: string): Promise<void> {
  await db.observation_assessments.delete(assessmentId);
}

export async function getAssessmentsForObservations(
  ids: string[]
): Promise<Record<string, AssessmentWithScale[]>> {
  if (ids.length === 0) return {};

  const assessments = await db.observation_assessments
    .where('observation_id')
    .anyOf(ids)
    .toArray();

  const scaleIds = [...new Set(assessments.map((a) => a.scale_id))];
  const scales = (await db.assessment_scales.bulkGet(scaleIds)).filter(
    (s): s is AssessmentScale => s !== undefined
  );
  const scaleMap = new Map(scales.map((s) => [s.id, s]));

  const result: Record<string, AssessmentWithScale[]> = {};
  for (const a of assessments) {
    const scale = scaleMap.get(a.scale_id);
    if (!scale) continue;
    if (!result[a.observation_id]) result[a.observation_id] = [];
    result[a.observation_id]!.push({ ...a, scale });
  }
  return result;
}
