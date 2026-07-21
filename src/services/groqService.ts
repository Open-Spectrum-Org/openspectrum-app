import type { GroqParsedResult, SuggestedObservation } from '../types/voice';
import { generateUUID } from '../utils/uuid';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an assistant for a caregiving app that tracks behaviors and events for neurodiverse children. A caregiver has spoken into the app. Your job is to analyze their speech and extract structured observations.

Classify the input as one of:
- "behavior_log": The caregiver is describing what they're observing (e.g., "He's having a meltdown, throwing toys")
- "command": The caregiver is giving an instruction (e.g., "Log a meltdown")

Extract one or more observations from the utterance. Each observation should have:
- category: One of: behavior, food, medication, emotion, sleep, sensory, transitions, successes, trigger, other
- title: A short description of what happened
- tagNames: Array of matching tag names from the system tags listed below
- confidence: A number between 0 and 1. Use 0.7-1.0 for explicitly mentioned items, 0.3-0.6 for inferred items.

System tag names by category:
- behavior: Meltdown, Calm, Aggressive, Focused, Stim, Anxious, Shutdown, Crying, Eloping, Self-harm
- food: Ate Well, Refused Food, Dairy, Sugar
- medication: Taken, Missed, Side Effect
- emotion: Happy, Irritated, Tired, Overwhelmed
- sleep: Slept Well, Poor Sleep, Nap
- sensory: Sensory Overload, Sensory Seeking
- transitions: Good Transition, Difficult Transition
- successes: Success Moment
- trigger: Noise, Hunger, Transition, School, Medication, Screen Time, Social Situation, Change in Routine, Sensory Overload, Unknown

Respond with JSON only in this exact format:
{
  "inputType": "behavior_log" or "command",
  "summary": "Brief human-readable summary of what was detected",
  "suggestedObservations": [
    {
      "category": "behavior",
      "title": "Having a meltdown",
      "tagNames": ["Meltdown"],
      "confidence": 0.9
    }
  ]
}`;

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function analyzeTranscript(transcript: string): Promise<GroqParsedResult> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not set');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    }),
  });

  if (response.status === 429) {
    throw new Error('Rate limited — try again in a moment');
  }

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data: GroqResponse = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Groq');
  }

  try {
    const parsed = JSON.parse(content);
    const observations: SuggestedObservation[] = (parsed.suggestedObservations ?? []).map(
      (obs: Omit<SuggestedObservation, 'id' | 'confirmed'>) => ({
        ...obs,
        id: generateUUID(),
        confirmed: true,
      })
    );

    return {
      inputType: parsed.inputType ?? 'behavior_log',
      summary: parsed.summary ?? '',
      suggestedObservations: observations,
    };
  } catch {
    // Fallback: create a single "other" observation from the transcript
    return {
      inputType: 'behavior_log',
      summary: transcript,
      suggestedObservations: [
        {
          id: generateUUID(),
          category: 'other',
          title: transcript,
          tagNames: [],
          confidence: 0.3,
          confirmed: true,
        },
      ],
    };
  }
}
