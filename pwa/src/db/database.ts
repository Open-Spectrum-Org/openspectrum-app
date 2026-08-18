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
