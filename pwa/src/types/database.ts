export interface User {
  id: string;
  email: string | null;
  display_name: string;
  user_type: 'parent' | 'grandparent' | 'caregiver' | 'therapist' | 'doctor' | 'teacher' | 'other';
  avatar_url: string | null;
  auth_provider_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface Family {
  id: string;
  family_name: string;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface Child {
  id: string;
  family_id: string;
  display_name: string;
  birth_year_month: string | null;
  avatar_url: string | null;
  profile_notes: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface TagDefinition {
  id: string;
  category: string;
  name: string;
  is_system: number;
  child_id: string | null;
  family_id: string | null;
  display_order: number;
  color: string | null;
  icon: string | null;
  created_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface ChildTag {
  id: string;
  child_id: string;
  tag_id: string;
  is_enabled: number;
  display_order: number;
}

export interface Observation {
  id: string;
  child_id: string;
  created_by: string | null;
  occurred_at: string;
  entry_type: 'quick_tap' | 'incident' | 'voice' | 'lock_screen' | 'manual';
  category: string;
  title: string | null;
  notes: string | null;
  incident_data: string | null;
  visibility_level: 'family' | 'parents' | 'clinical' | 'private' | 'custom';
  is_partial: number;
  voice_log_id: string | null;
  parent_observation_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface ObservationTag {
  observation_id: string;
  tag_id: string;
}

export interface VoiceLog {
  id: string;
  observation_id: string;
  audio_file_path: string | null;
  audio_duration_secs: number | null;
  raw_transcript: string | null;
  edited_transcript: string | null;
  ai_parse_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  ai_parsed_at: string | null;
  created_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

export interface AiExtractedEvent {
  id: string;
  voice_log_id: string;
  observation_id: string | null;
  extracted_category: string;
  extracted_value: string;
  confidence: number | null;
  user_action: 'pending' | 'confirmed' | 'edited' | 'deleted';
  user_edited_value: string | null;
  created_at: string;
}

export interface DailyReflection {
  id: string;
  child_id: string;
  created_by: string | null;
  reflection_date: string;
  rating: 'better_than_usual' | 'typical' | 'difficult';
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

// Joined types for UI
export interface TagWithCategory extends TagDefinition {
  is_enabled: number;
}

export interface ObservationWithTags extends Observation {
  tags: TagDefinition[];
}

export interface DaySummary {
  behavior: number;
  emotion: number;
  food: number;
  medication: number;
}
