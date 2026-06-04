import type { SQLiteDatabase } from 'expo-sqlite';
import { generateUUID } from '../utils/uuid';

// Fixed IDs for test data so we can reference them
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

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  // Check if already seeded
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users'
  );
  if (existing && existing.count > 0) return;

  // Insert test user
  await db.runAsync(
    `INSERT INTO users (id, display_name, user_type) VALUES (?, ?, ?)`,
    [TEST_USER_ID, 'Test Parent', 'parent']
  );

  // Insert test family
  await db.runAsync(
    `INSERT INTO families (id, family_name) VALUES (?, ?)`,
    [TEST_FAMILY_ID, 'Test Family']
  );

  // Insert family member link
  await db.runAsync(
    `INSERT INTO family_members (id, family_id, user_id, role) VALUES (?, ?, ?, ?)`,
    [TEST_FAMILY_MEMBER_ID, TEST_FAMILY_ID, TEST_USER_ID, 'owner']
  );

  // Insert test child
  await db.runAsync(
    `INSERT INTO children (id, family_id, display_name, birth_year_month) VALUES (?, ?, ?, ?)`,
    [TEST_CHILD_ID, TEST_FAMILY_ID, 'Aarav', '2018-04']
  );

  // Insert system tags and child_tags
  for (let i = 0; i < SYSTEM_TAGS.length; i++) {
    const tag = SYSTEM_TAGS[i];
    const tagId = generateUUID();
    await db.runAsync(
      `INSERT INTO tag_definitions (id, category, name, is_system, display_order, color) VALUES (?, ?, ?, 1, ?, ?)`,
      [tagId, tag.category, tag.name, i, tag.color]
    );
    // Enable all tags for the test child
    await db.runAsync(
      `INSERT INTO child_tags (id, child_id, tag_id, is_enabled, display_order) VALUES (?, ?, ?, 1, ?)`,
      [generateUUID(), TEST_CHILD_ID, tagId, i]
    );
  }
}
