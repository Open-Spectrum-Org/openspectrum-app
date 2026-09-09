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

// Known system tag categories — open string allows custom categories too
export type TagCategory =
  | 'behavior'
  | 'food'
  | 'medication'
  | 'emotion'
  | 'sleep'
  | 'sensory'
  | 'transitions'
  | 'successes'
  | 'trigger'
  | 'other';

export const SYSTEM_TAG_CATEGORIES: TagCategory[] = [
  'behavior',
  'food',
  'medication',
  'emotion',
  'sleep',
  'sensory',
  'transitions',
  'successes',
  'trigger',
  'other',
];

export interface TagDefinition {
  id: string;
  category: string; // open string; TagCategory for system tags
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
  // Time precision and range
  event_time_precision: 'exact' | 'date_only' | 'approximate' | 'unknown';
  event_end_at: string | null;
  event_timezone: string | null;
  entry_type: 'quick_tap' | 'incident' | 'voice' | 'lock_screen' | 'manual';
  category: string;
  title: string | null;
  notes: string | null;
  // Rich event fields (first-class columns)
  duration_minutes: number | null;
  quantity: string | null;       // JSON: {"value": 2.5, "unit": "mg"}
  severity: number | null;       // 1–5
  confidence: number | null;     // 0.0–1.0 parent confidence
  context_data: string | null;   // JSON: school_day, location, routine, etc.
  event_data: string | null;     // replaces incident_data — type-specific extra attributes
  // Data provenance
  data_layer: 'raw' | 'derived' | 'ai_interpreted';
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

// Assessment scales — configurable rating systems per event type
export interface AssessmentScale {
  id: string;
  name: string;
  scale_type: 'numeric' | 'categorical';
  min_value: number | null;
  max_value: number | null;
  labels: string | null;          // JSON: {"1":"Very Low","5":"Very High"}
  options: string | null;         // JSON: ["adverse","neutral","positive"]
  applies_to_categories: string | null; // JSON array of category strings
  is_system: number;              // 1 = seeded, 0 = parent-defined
  child_id: string | null;
  created_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

// Per-observation ratings against a scale
export interface ObservationAssessment {
  id: string;
  observation_id: string;
  scale_id: string;
  numeric_value: number | null;
  categorical_value: string | null;
  comparative_value: 'better' | 'same' | 'worse' | null;
  created_at: string;
}

// Focus Areas — active investigations ("Are mornings getting harder?")
export interface FocusArea {
  id: string;
  child_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed';
  related_tag_ids: string | null;      // JSON array of tag UUIDs
  related_categories: string | null;   // JSON array of category strings
  questions: string | null;            // JSON array of investigative questions
  created_at: string;
  updated_at: string;
  is_deleted: number;
  sync_status: 'pending' | 'synced' | 'conflict';
  last_synced_at: string | null;
  device_id: string | null;
  version: number;
}

// Explicit or system-derived linkage between observations and focus areas
export interface ObservationFocusArea {
  observation_id: string;
  focus_area_id: string;
  link_type: 'explicit' | 'derived';
  created_at: string;
}

// Joined types for UI
export interface TagWithCategory extends TagDefinition {
  is_enabled: number;
}

export interface AssessmentWithScale extends ObservationAssessment {
  scale: AssessmentScale;
}

export interface ObservationWithTags extends Observation {
  tags: TagDefinition[];
  assessments?: AssessmentWithScale[];
}

export interface DaySummary {
  behavior: number;
  emotion: number;
  food: number;
  medication: number;
}
