import Dexie, { type EntityTable, type Table } from 'dexie';
import type {
  User,
  Family,
  FamilyMember,
  Child,
  TagDefinition,
  ChildTag,
  Observation,
  ObservationTag,
  VoiceLog,
  AiExtractedEvent,
  DailyReflection,
  AssessmentScale,
  ObservationAssessment,
  FocusArea,
  ObservationFocusArea,
} from '../types/database';
import { seedDatabase } from './seed';

class OpenSpectrumDB extends Dexie {
  users!: EntityTable<User, 'id'>;
  families!: EntityTable<Family, 'id'>;
  family_members!: EntityTable<FamilyMember, 'id'>;
  children!: EntityTable<Child, 'id'>;
  tag_definitions!: EntityTable<TagDefinition, 'id'>;
  child_tags!: EntityTable<ChildTag, 'id'>;
  observations!: EntityTable<Observation, 'id'>;
  observation_tags!: Table<ObservationTag>;
  voice_logs!: EntityTable<VoiceLog, 'id'>;
  ai_extracted_events!: EntityTable<AiExtractedEvent, 'id'>;
  daily_reflections!: EntityTable<DailyReflection, 'id'>;
  assessment_scales!: EntityTable<AssessmentScale, 'id'>;
  observation_assessments!: EntityTable<ObservationAssessment, 'id'>;
  focus_areas!: EntityTable<FocusArea, 'id'>;
  observation_focus_areas!: Table<ObservationFocusArea>;

  constructor() {
    super('openspectrum');

    this.version(1).stores({
      users: 'id, email, auth_provider_id',
      families: 'id',
      family_members: 'id, family_id, user_id, [family_id+user_id]',
      children: 'id, family_id',
      tag_definitions: 'id, category, child_id, [category+name+child_id]',
      child_tags: 'id, child_id, tag_id, [child_id+tag_id]',
      observations: 'id, child_id, [child_id+occurred_at], [child_id+category], entry_type, voice_log_id, parent_observation_id',
      observation_tags: '[observation_id+tag_id], observation_id, tag_id',
      voice_logs: 'id, observation_id, ai_parse_status',
      ai_extracted_events: 'id, voice_log_id',
      daily_reflections: 'id, [child_id+reflection_date], child_id',
    });

    this.version(2)
      .stores({
        users: 'id, email, auth_provider_id',
        families: 'id',
        family_members: 'id, family_id, user_id, [family_id+user_id]',
        children: 'id, family_id',
        tag_definitions: 'id, category, child_id, [category+name+child_id]',
        child_tags: 'id, child_id, tag_id, [child_id+tag_id]',
        observations: 'id, child_id, [child_id+occurred_at], [child_id+category], entry_type, voice_log_id, parent_observation_id, data_layer',
        observation_tags: '[observation_id+tag_id], observation_id, tag_id',
        voice_logs: 'id, observation_id, ai_parse_status',
        ai_extracted_events: 'id, voice_log_id',
        daily_reflections: 'id, [child_id+reflection_date], child_id',
        // New tables
        assessment_scales: 'id, scale_type, is_system, child_id',
        observation_assessments: 'id, observation_id, scale_id',
        focus_areas: 'id, child_id, status',
        observation_focus_areas: '[observation_id+focus_area_id], observation_id, focus_area_id',
      })
      .upgrade((tx) => {
        // Migrate existing observations: set new required fields to safe defaults
        return tx
          .table('observations')
          .toCollection()
          .modify((obs) => {
            if (obs.event_time_precision === undefined) {
              obs.event_time_precision = 'exact';
            }
            if (obs.data_layer === undefined) {
              obs.data_layer = 'raw';
            }
            if (obs.event_end_at === undefined) {
              obs.event_end_at = null;
            }
            if (obs.event_timezone === undefined) {
              obs.event_timezone = null;
            }
            if (obs.duration_minutes === undefined) {
              obs.duration_minutes = null;
            }
            if (obs.quantity === undefined) {
              obs.quantity = null;
            }
            if (obs.severity === undefined) {
              obs.severity = null;
            }
            if (obs.confidence === undefined) {
              obs.confidence = null;
            }
            if (obs.context_data === undefined) {
              obs.context_data = null;
            }
            // Copy incident_data → event_data if present
            if (obs.event_data === undefined) {
              obs.event_data = obs.incident_data ?? null;
            }
          });
      });
  }
}

export const db = new OpenSpectrumDB();

let seeded = false;

export async function initDatabase(): Promise<void> {
  if (seeded) return;
  seeded = true;
  await seedDatabase(db);
}

export type { OpenSpectrumDB };
