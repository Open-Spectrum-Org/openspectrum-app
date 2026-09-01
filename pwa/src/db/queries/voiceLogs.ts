import { db } from '../database';
import { generateUUID } from '../../utils/uuid';
import { nowISO } from '../../utils/date';
import type { SuggestedObservation } from '../../types/voice';

export async function saveVoiceLogWithObservations(
  childId: string,
  userId: string,
  transcript: string,
  aiSummary: string,
  durationSeconds: number,
  confirmedObservations: SuggestedObservation[]
): Promise<string[]> {
  const parentObsId = generateUUID();
  const voiceLogId = generateUUID();
  const now = nowISO();
  const savedIds: string[] = [];

  await db.transaction('rw', [db.observations, db.voice_logs, db.observation_tags, db.ai_extracted_events, db.tag_definitions], async () => {
    // 1. Insert parent observation (entry_type = 'voice')
    await db.observations.put({
      id: parentObsId,
      child_id: childId,
      created_by: userId,
      occurred_at: now,
      entry_type: 'voice',
      category: 'transcript',
      title: transcript,
      notes: aiSummary || null,
      incident_data: null,
      visibility_level: 'family',
      is_partial: 0,
      voice_log_id: voiceLogId,
      parent_observation_id: null,
      created_at: now,
      updated_at: now,
      is_deleted: 0,
      sync_status: 'pending',
      last_synced_at: null,
      device_id: null,
      version: 1,
    });

    // 2. Insert voice_logs row
    await db.voice_logs.put({
      id: voiceLogId,
      observation_id: parentObsId,
      audio_file_path: null,
      audio_duration_secs: durationSeconds,
      raw_transcript: transcript,
      edited_transcript: null,
      ai_parse_status: 'completed',
      ai_parsed_at: now,
      created_at: now,
      is_deleted: 0,
      sync_status: 'pending',
      last_synced_at: null,
      device_id: null,
      version: 1,
    });

    // 3. For each confirmed suggestion: insert observation, tags, and ai_extracted_events
    for (const suggestion of confirmedObservations) {
      const obsId = generateUUID();

      await db.observations.put({
        id: obsId,
        child_id: childId,
        created_by: userId,
        occurred_at: now,
        entry_type: 'voice',
        category: suggestion.category,
        title: suggestion.title,
        notes: null,
        incident_data: null,
        visibility_level: 'family',
        is_partial: 0,
        voice_log_id: null,
        parent_observation_id: parentObsId,
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        last_synced_at: null,
        device_id: null,
        version: 1,
      });
      savedIds.push(obsId);

      // Link tags by name
      for (const tagName of suggestion.tagNames) {
        const tag = await db.tag_definitions
          .where({ category: suggestion.category, name: tagName })
          .and((t) => t.is_system === 1)
          .first();

        if (tag) {
          await db.observation_tags.put({
            observation_id: obsId,
            tag_id: tag.id,
          });
        }
      }

      // Insert ai_extracted_events audit row
      await db.ai_extracted_events.put({
        id: generateUUID(),
        voice_log_id: voiceLogId,
        observation_id: obsId,
        extracted_category: suggestion.category,
        extracted_value: suggestion.title,
        confidence: suggestion.confidence,
        user_action: 'confirmed',
        user_edited_value: null,
        created_at: now,
      });
    }
  });

  return savedIds;
}
