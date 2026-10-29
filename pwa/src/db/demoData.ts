import { db } from './database';
import { TEST_USER_ID } from './seed';
import { generateUUID } from '../utils/uuid';
import { localDateString } from '../utils/date';
import type { Observation, DailyReflection } from '../types/database';

// Demo rows are marked with this device_id so they can be removed cleanly.
const DEMO_DEVICE_ID = 'demo-seed';
export const DEMO_CHILD_NAME = 'Adam';
const DAYS_BACK = 14;

// Small seeded RNG so the generated history is the same every time.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface DemoEvent {
  hour: number; // local time, e.g. 7.5 = 7:30am
  category: string;
  tag: string;
  severity?: number; // Behavior Severity 1–5
  mood?: number; // Mood 1–5
  sleepQuality?: number; // Sleep Quality 1–5
  foodReaction?: 'adverse' | 'neutral' | 'positive';
  medEffect?: 'worse' | 'no_change' | 'better';
}

interface DemoVoice {
  hour: number;
  transcript: string;
  summary: string;
  items: { category: string; title: string; tag: string }[];
}

// Voice notes placed on specific days (days ago → note).
const VOICE_NOTES: Record<number, DemoVoice> = {
  12: {
    hour: 16,
    transcript: "Pickup from school was rough. He covered his ears in the car line and cried most of the way home. Calmed down after a snack.",
    summary: 'Difficult school pickup with noise sensitivity, calmed after snack',
    items: [
      { category: 'transitions', title: 'Difficult school pickup', tag: 'Difficult Transition' },
      { category: 'trigger', title: 'Car line noise', tag: 'Noise' },
      { category: 'behavior', title: 'Crying on the way home', tag: 'Crying' },
    ],
  },
  9: {
    hour: 10.5,
    transcript: 'Great morning at the park. He took turns on the slide with another kid without any prompting.',
    summary: 'Played well at the park and took turns independently',
    items: [
      { category: 'successes', title: 'Took turns on the slide', tag: 'Success Moment' },
      { category: 'emotion', title: 'Happy at the park', tag: 'Happy' },
    ],
  },
  5: {
    hour: 18.5,
    transcript: "Forgot his evening medication until late, and he's been really irritable and couldn't settle for dinner.",
    summary: 'Late medication, irritable and skipped dinner',
    items: [
      { category: 'medication', title: 'Evening dose missed', tag: 'Missed' },
      { category: 'emotion', title: 'Irritable before dinner', tag: 'Irritated' },
      { category: 'food', title: 'Refused dinner', tag: 'Refused Food' },
    ],
  },
  2: {
    hour: 15.5,
    transcript: 'Teacher said he stayed focused for the whole reading block today and used his calm-down card once.',
    summary: 'Focused during reading block, self-regulated with calm-down card',
    items: [
      { category: 'behavior', title: 'Focused in reading block', tag: 'Focused' },
      { category: 'successes', title: 'Used calm-down card', tag: 'Success Moment' },
    ],
  },
};

function buildDay(daysAgo: number, weekday: number, rand: () => number): { events: DemoEvent[]; rating: DailyReflection['rating'] } {
  const isSchoolDay = weekday >= 1 && weekday <= 5;
  const poorSleep = rand() < 0.3;
  const missedMeds = daysAgo === 5 || daysAgo === 11;
  const events: DemoEvent[] = [];
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;

  events.push(
    poorSleep
      ? { hour: 7, category: 'sleep', tag: 'Poor Sleep', sleepQuality: pick([1, 2]) }
      : { hour: 7, category: 'sleep', tag: 'Slept Well', sleepQuality: pick([4, 5]) }
  );

  if (!missedMeds) {
    events.push({ hour: 7.75, category: 'medication', tag: 'Taken', medEffect: pick(['better', 'no_change', 'no_change']) });
  }

  events.push(
    rand() < 0.75
      ? { hour: 8, category: 'food', tag: 'Ate Well', foodReaction: 'positive' }
      : { hour: 8, category: 'food', tag: 'Refused Food', foodReaction: 'neutral' }
  );

  let hardDay = poorSleep || missedMeds;

  if (isSchoolDay) {
    if (hardDay || rand() < 0.35) {
      events.push({ hour: 15.5, category: 'transitions', tag: 'Difficult Transition' });
      events.push({ hour: 15.6, category: 'trigger', tag: pick(['School', 'Noise', 'Transition']) });
      if (hardDay && rand() < 0.7) {
        events.push({ hour: 16, category: 'behavior', tag: 'Meltdown', severity: pick([3, 4]), mood: 2 });
        hardDay = true;
      } else {
        events.push({ hour: 16, category: 'emotion', tag: 'Tired', mood: 3 });
      }
    } else {
      events.push({ hour: 15.5, category: 'transitions', tag: 'Good Transition' });
      events.push({ hour: 16.5, category: 'behavior', tag: pick(['Calm', 'Focused']), mood: 4 });
    }
  } else {
    events.push({ hour: 10, category: 'emotion', tag: 'Happy', mood: pick([4, 5]) });
    if (rand() < 0.5) {
      events.push({ hour: 12.5, category: 'sensory', tag: 'Sensory Overload' });
      events.push({ hour: 12.6, category: 'trigger', tag: 'Social Situation' });
      events.push({ hour: 13, category: 'behavior', tag: 'Stim', severity: 2, mood: 3 });
    } else {
      events.push({ hour: 14, category: 'successes', tag: 'Success Moment' });
    }
  }

  if (rand() < 0.4) {
    events.push({ hour: 17.5, category: 'food', tag: 'Sugar', foodReaction: hardDay ? 'adverse' : 'neutral' });
  }
  if (hardDay && rand() < 0.5) {
    events.push({ hour: 18.5, category: 'emotion', tag: pick(['Irritated', 'Overwhelmed']), mood: 2 });
  } else if (rand() < 0.5) {
    events.push({ hour: 18.5, category: 'behavior', tag: 'Calm', mood: 4 });
  }

  const rating: DailyReflection['rating'] = hardDay ? 'difficult' : rand() < 0.35 ? 'better_than_usual' : 'typical';
  return { events, rating };
}

function atLocalTime(date: Date, hour: number, rand: () => number): string {
  const d = new Date(date);
  const minutes = Math.round(hour * 60 + rand() * 20 - 10);
  d.setHours(0, minutes, 0, 0);
  return d.toISOString();
}

function baseObservation(childId: string, occurredAt: string): Omit<Observation, 'id' | 'entry_type' | 'category' | 'title'> {
  return {
    child_id: childId,
    created_by: TEST_USER_ID,
    occurred_at: occurredAt,
    event_time_precision: 'exact',
    event_end_at: null,
    event_timezone: null,
    notes: null,
    duration_minutes: null,
    quantity: null,
    severity: null,
    confidence: null,
    context_data: null,
    event_data: null,
    data_layer: 'raw',
    visibility_level: 'family',
    is_partial: 0,
    voice_log_id: null,
    parent_observation_id: null,
    created_at: occurredAt,
    updated_at: occurredAt,
    is_deleted: 0,
    sync_status: 'pending',
    last_synced_at: null,
    device_id: DEMO_DEVICE_ID,
    version: 1,
  };
}

export async function loadDemoData(childId: string): Promise<number> {
  await clearDemoData(childId);

  const rand = mulberry32(42);
  const tags = await db.tag_definitions.filter((t) => t.is_system === 1).toArray();
  const tagId = (category: string, name: string) =>
    tags.find((t) => t.category === category && t.name === name)?.id;
  const scales = await db.assessment_scales.toArray();
  const scaleId = (name: string) => scales.find((s) => s.name === name)?.id;

  const observations: Observation[] = [];
  const obsTags: { observation_id: string; tag_id: string }[] = [];
  const assessments: {
    id: string; observation_id: string; scale_id: string;
    numeric_value: number | null; categorical_value: string | null; comparative_value: null; created_at: string;
  }[] = [];
  const reflections: DailyReflection[] = [];

  const addAssessment = (obsId: string, scale: string, at: string, numeric: number | null, categorical: string | null) => {
    const id = scaleId(scale);
    if (!id) return;
    assessments.push({
      id: generateUUID(), observation_id: obsId, scale_id: id,
      numeric_value: numeric, categorical_value: categorical, comparative_value: null, created_at: at,
    });
  };

  for (let daysAgo = DAYS_BACK; daysAgo >= 1; daysAgo--) {
    const day = new Date();
    day.setDate(day.getDate() - daysAgo);
    const { events, rating } = buildDay(daysAgo, day.getDay(), rand);

    for (const ev of events) {
      const id = tagId(ev.category, ev.tag);
      if (!id) continue;
      const at = atLocalTime(day, ev.hour, rand);
      const obsId = generateUUID();
      observations.push({ ...baseObservation(childId, at), id: obsId, entry_type: 'quick_tap', category: ev.category, title: ev.tag });
      obsTags.push({ observation_id: obsId, tag_id: id });
      if (ev.severity) addAssessment(obsId, 'Behavior Severity', at, ev.severity, null);
      if (ev.mood) addAssessment(obsId, 'Mood', at, ev.mood, null);
      if (ev.sleepQuality) addAssessment(obsId, 'Sleep Quality', at, ev.sleepQuality, null);
      if (ev.foodReaction) addAssessment(obsId, 'Food Reaction', at, null, ev.foodReaction);
      if (ev.medEffect) addAssessment(obsId, 'Medication Effect', at, null, ev.medEffect);
    }

    const reflectionAt = atLocalTime(day, 19, rand);
    reflections.push({
      id: generateUUID(),
      child_id: childId,
      created_by: TEST_USER_ID,
      reflection_date: localDateString(day),
      rating,
      notes: null,
      created_at: reflectionAt,
      updated_at: reflectionAt,
      is_deleted: 0,
      sync_status: 'pending',
      last_synced_at: null,
      device_id: DEMO_DEVICE_ID,
      version: 1,
    });

    const voice = VOICE_NOTES[daysAgo];
    if (voice) {
      const at = atLocalTime(day, voice.hour, rand);
      const parentId = generateUUID();
      const voiceLogId = generateUUID();
      observations.push({
        ...baseObservation(childId, at), id: parentId, entry_type: 'voice', category: 'transcript',
        title: voice.transcript, notes: voice.summary, voice_log_id: voiceLogId,
      });
      await db.voice_logs.put({
        id: voiceLogId, observation_id: parentId, audio_file_path: null,
        audio_duration_secs: 8 + Math.round(rand() * 12), raw_transcript: voice.transcript,
        edited_transcript: null, ai_parse_status: 'completed', ai_parsed_at: at, created_at: at,
        is_deleted: 0, sync_status: 'pending', last_synced_at: null, device_id: DEMO_DEVICE_ID, version: 1,
      });
      for (const item of voice.items) {
        const childObsId = generateUUID();
        observations.push({
          ...baseObservation(childId, at), id: childObsId, entry_type: 'voice',
          category: item.category, title: item.title, parent_observation_id: parentId,
        });
        const id = tagId(item.category, item.tag);
        if (id) obsTags.push({ observation_id: childObsId, tag_id: id });
      }
    }
  }

  // Don't overwrite reflections the user entered themselves.
  const existingDates = new Set(
    (await db.daily_reflections.where('child_id').equals(childId).toArray()).map((r) => r.reflection_date)
  );

  await db.transaction('rw', [db.observations, db.observation_tags, db.observation_assessments, db.daily_reflections], async () => {
    await db.observations.bulkPut(observations);
    await db.observation_tags.bulkPut(obsTags);
    await db.observation_assessments.bulkPut(assessments);
    await db.daily_reflections.bulkPut(reflections.filter((r) => !existingDates.has(r.reflection_date)));
  });

  return observations.filter((o) => o.category !== 'transcript').length;
}

export async function clearDemoData(childId: string): Promise<void> {
  const demoObs = await db.observations
    .where('child_id').equals(childId)
    .filter((o) => o.device_id === DEMO_DEVICE_ID)
    .toArray();
  const obsIds = demoObs.map((o) => o.id);
  const voiceLogIds = demoObs.map((o) => o.voice_log_id).filter((id): id is string => !!id);

  await db.transaction('rw', [db.observations, db.observation_tags, db.observation_assessments, db.voice_logs, db.daily_reflections], async () => {
    await db.observation_tags.where('observation_id').anyOf(obsIds).delete();
    await db.observation_assessments.where('observation_id').anyOf(obsIds).delete();
    await db.voice_logs.bulkDelete(voiceLogIds);
    await db.observations.bulkDelete(obsIds);
    await db.daily_reflections
      .where('child_id').equals(childId)
      .filter((r) => r.device_id === DEMO_DEVICE_ID)
      .delete();
  });
}
