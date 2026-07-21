import type { SQLiteDatabase } from 'expo-sqlite';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { SuggestedObservation } from '../../types/voice';

export async function saveVoiceLogWithObservations(
  db: SQLiteDatabase,
  childId: string,
  userId: string,
  transcript: string,
  durationSeconds: number,
  confirmedObservations: SuggestedObservation[]
): Promise<string> {
  const parentObsId = generateUUID();
  const voiceLogId = generateUUID();
  const now = nowISO();

  await db.withTransactionAsync(async () => {
    // 1. Insert parent observation (entry_type = 'voice')
    await db.runAsync(
      `INSERT INTO observations (id, child_id, created_by, occurred_at, entry_type, category, title, voice_log_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'voice', 'other', ?, ?, ?, ?)`,
      [parentObsId, childId, userId, now, `Voice log: ${transcript.slice(0, 80)}`, voiceLogId, now, now]
    );

    // 2. Insert voice_logs row
    await db.runAsync(
      `INSERT INTO voice_logs (id, observation_id, audio_duration_secs, raw_transcript, ai_parse_status, ai_parsed_at, created_at)
       VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
      [voiceLogId, parentObsId, durationSeconds, transcript, now, now]
    );

    // 3. For each confirmed suggestion: insert observation, tags, and ai_extracted_events
    for (const suggestion of confirmedObservations) {
      const obsId = generateUUID();

      await db.runAsync(
        `INSERT INTO observations (id, child_id, created_by, occurred_at, entry_type, category, title, parent_observation_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'voice', ?, ?, ?, ?, ?)`,
        [obsId, childId, userId, now, suggestion.category, suggestion.title, parentObsId, now, now]
      );

      // Link tags by name
      for (const tagName of suggestion.tagNames) {
        const tag = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM tag_definitions WHERE name = ? AND category = ? AND is_system = 1`,
          [tagName, suggestion.category]
        );
        if (tag) {
          await db.runAsync(
            `INSERT OR IGNORE INTO observation_tags (observation_id, tag_id) VALUES (?, ?)`,
            [obsId, tag.id]
          );
        }
      }

      // Insert ai_extracted_events audit row
      await db.runAsync(
        `INSERT INTO ai_extracted_events (id, voice_log_id, observation_id, extracted_category, extracted_value, confidence, user_action)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
        [generateUUID(), voiceLogId, obsId, suggestion.category, suggestion.title, suggestion.confidence]
      );
    }
  });

  return parentObsId;
}
