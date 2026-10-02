import type { OpenSpectrumDB } from './database';
import { generateUUID } from '../utils/uuid';
import { nowISO } from '../utils/date';

export const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_FAMILY_ID = '00000000-0000-0000-0000-000000000002';
export const TEST_FAMILY_MEMBER_ID = '00000000-0000-0000-0000-000000000003';
export const TEST_CHILD_ID = '00000000-0000-0000-0000-000000000004';

interface SystemTag {
  category: string;
  name: string;
  color: string;
}

const SYSTEM_TAGS: SystemTag[] = [
  // Behavior (purple)
  { category: 'behavior', name: 'Meltdown', color: '#7C3AED' },
  { category: 'behavior', name: 'Calm', color: '#7C3AED' },
  { category: 'behavior', name: 'Aggressive', color: '#7C3AED' },
  { category: 'behavior', name: 'Focused', color: '#7C3AED' },
  { category: 'behavior', name: 'Stim', color: '#7C3AED' },
  { category: 'behavior', name: 'Anxious', color: '#7C3AED' },
  { category: 'behavior', name: 'Shutdown', color: '#7C3AED' },
  { category: 'behavior', name: 'Crying', color: '#7C3AED' },
  { category: 'behavior', name: 'Eloping', color: '#7C3AED' },
  { category: 'behavior', name: 'Self-harm', color: '#7C3AED' },
  // Food (teal)
  { category: 'food', name: 'Ate Well', color: '#14B8A6' },
  { category: 'food', name: 'Refused Food', color: '#14B8A6' },
  { category: 'food', name: 'Dairy', color: '#14B8A6' },
  { category: 'food', name: 'Sugar', color: '#14B8A6' },
  // Medication (amber)
  { category: 'medication', name: 'Taken', color: '#F59E0B' },
  { category: 'medication', name: 'Missed', color: '#F59E0B' },
  { category: 'medication', name: 'Side Effect', color: '#F59E0B' },
  // Emotion (pink)
  { category: 'emotion', name: 'Happy', color: '#EC4899' },
  { category: 'emotion', name: 'Irritated', color: '#EC4899' },
  { category: 'emotion', name: 'Tired', color: '#EC4899' },
  { category: 'emotion', name: 'Overwhelmed', color: '#EC4899' },
  // Sleep (indigo)
  { category: 'sleep', name: 'Slept Well', color: '#6366F1' },
  { category: 'sleep', name: 'Poor Sleep', color: '#6366F1' },
  { category: 'sleep', name: 'Nap', color: '#6366F1' },
  // Sensory (violet)
  { category: 'sensory', name: 'Sensory Overload', color: '#8B5CF6' },
  { category: 'sensory', name: 'Sensory Seeking', color: '#8B5CF6' },
  // Transitions (cyan)
  { category: 'transitions', name: 'Good Transition', color: '#06B6D4' },
  { category: 'transitions', name: 'Difficult Transition', color: '#06B6D4' },
  // Successes (green)
  { category: 'successes', name: 'Success Moment', color: '#22C55E' },
  // Trigger (red)
  { category: 'trigger', name: 'Noise', color: '#EF4444' },
  { category: 'trigger', name: 'Hunger', color: '#EF4444' },
  { category: 'trigger', name: 'Transition', color: '#EF4444' },
  { category: 'trigger', name: 'School', color: '#EF4444' },
  { category: 'trigger', name: 'Medication', color: '#EF4444' },
  { category: 'trigger', name: 'Screen Time', color: '#EF4444' },
  { category: 'trigger', name: 'Social Situation', color: '#EF4444' },
  { category: 'trigger', name: 'Change in Routine', color: '#EF4444' },
  { category: 'trigger', name: 'Sensory Overload', color: '#EF4444' },
  { category: 'trigger', name: 'Unknown', color: '#EF4444' },
];

interface SystemScale {
  name: string;
  scale_type: 'numeric' | 'categorical';
  min_value: number | null;
  max_value: number | null;
  labels: string | null;
  options: string | null;
  applies_to_categories: string | null;
}

export const SYSTEM_SCALES: SystemScale[] = [
  {
    name: 'Mood',
    scale_type: 'numeric',
    min_value: 1,
    max_value: 5,
    labels: JSON.stringify({ 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'High', 5: 'Very High' }),
    options: null,
    applies_to_categories: JSON.stringify(['emotion', 'behavior']),
  },
  {
    name: 'Sleep Quality',
    scale_type: 'numeric',
    min_value: 1,
    max_value: 5,
    labels: JSON.stringify({ 1: 'Very Poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Very Good' }),
    options: null,
    applies_to_categories: JSON.stringify(['sleep']),
  },
  {
    name: 'Behavior Severity',
    scale_type: 'numeric',
    min_value: 1,
    max_value: 5,
    labels: JSON.stringify({ 1: 'Mild', 2: 'Moderate', 3: 'Significant', 4: 'Severe', 5: 'Extreme' }),
    options: null,
    applies_to_categories: JSON.stringify(['behavior']),
  },
  {
    name: 'Food Reaction',
    scale_type: 'categorical',
    min_value: null,
    max_value: null,
    labels: null,
    options: JSON.stringify(['adverse', 'neutral', 'positive']),
    applies_to_categories: JSON.stringify(['food']),
  },
  {
    name: 'Medication Effect',
    scale_type: 'categorical',
    min_value: null,
    max_value: null,
    labels: null,
    options: JSON.stringify(['worse', 'no_change', 'better']),
    applies_to_categories: JSON.stringify(['medication']),
  },
];

export async function seedDatabase(db: OpenSpectrumDB): Promise<void> {
  // Check if already seeded
  const userCount = await db.users.count();
  if (userCount > 0) return;

  const now = nowISO();

  // Insert test user
  await db.users.put({
    id: TEST_USER_ID,
    email: null,
    display_name: 'Test Parent',
    user_type: 'parent',
    avatar_url: null,
    auth_provider_id: null,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  });

  // Insert test family
  await db.families.put({
    id: TEST_FAMILY_ID,
    family_name: 'Test Family',
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  });

  // Insert family member link
  await db.family_members.put({
    id: TEST_FAMILY_MEMBER_ID,
    family_id: TEST_FAMILY_ID,
    user_id: TEST_USER_ID,
    role: 'owner',
    joined_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: null,
    version: 1,
  });

  // Insert system tags (child_tags are linked per-patient when a patient is created)
  const tagDefs = SYSTEM_TAGS.map((tag, i) => ({
    id: generateUUID(),
    category: tag.category,
    name: tag.name,
    is_system: 1 as const,
    child_id: null,
    family_id: null,
    display_order: i,
    color: tag.color,
    icon: null,
    created_at: now,
    is_deleted: 0 as const,
    sync_status: 'pending' as const,
    last_synced_at: null,
    device_id: null,
    version: 1,
  }));

  await db.tag_definitions.bulkPut(tagDefs);

  // Seed system assessment scales
  const scaleDefs = SYSTEM_SCALES.map((scale) => ({
    id: generateUUID(),
    name: scale.name,
    scale_type: scale.scale_type,
    min_value: scale.min_value,
    max_value: scale.max_value,
    labels: scale.labels,
    options: scale.options,
    applies_to_categories: scale.applies_to_categories,
    is_system: 1 as const,
    child_id: null,
    created_at: now,
    is_deleted: 0 as const,
    sync_status: 'pending' as const,
    last_synced_at: null,
    device_id: null,
    version: 1,
  }));

  await db.assessment_scales.bulkPut(scaleDefs);
}
