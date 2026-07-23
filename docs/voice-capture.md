# Hold to Speak — Voice Capture Feature

## What Was Built

A voice logging pipeline that lets caregivers speak observations instead of typing. The flow:

1. **Hold** the mic button to record speech (Web Speech API)
2. **Release** to stop — transcript appears in a review sheet
3. **Analyze** sends the transcript to Groq AI (Llama 3.3 70B) which extracts structured observations mapped to the app's categories and tags
4. **Review** the AI suggestions — edit transcript, toggle/remove observations
5. **Confirm** saves everything to the database in a single transaction

### Files Added

| File | Role |
|------|------|
| `src/types/voice.ts` | Type definitions for the pipeline |
| `src/types/speech-recognition.d.ts` | Web Speech API TypeScript declarations |
| `src/services/groqService.ts` | Groq API client with system prompt |
| `src/db/queries/voiceLogs.ts` | DB transaction for saving voice logs |
| `src/hooks/useVoiceCapture.ts` | State machine hook for the recording pipeline |
| `src/components/VoiceReviewSheet.tsx` | Review/confirm modal UI |

### Files Modified

| File | Change |
|------|--------|
| `src/components/MicButton.tsx` | Hold interaction, recording animation, visual states |
| `app/(tabs)/index.tsx` | Wired hook, review sheet, and DB save |
| `.gitignore` | Added `.env` |

---

## How to Test

### Prerequisites

- **Browser**: Chrome (desktop or Android). Web Speech API is not available in Firefox or Safari.
- **Groq API key**: Get a free key at [console.groq.com](https://console.groq.com). Add it to `.env`:
  ```
  EXPO_PUBLIC_GROQ_API_KEY=gsk_your_key_here
  ```
- **Microphone access**: The browser will prompt for permission on first use.

### Running the App

```bash
cd openspectrum-app
npx expo start --web
```

Open in Chrome at the URL Expo prints (usually `http://localhost:8081`).

### Test Scenarios

#### 1. Basic Recording Flow

- Hold the mic button — it should turn red with a pulsing animation
- Speak a sentence (e.g., "He's having a meltdown")
- Release — the review sheet should open with your transcript
- Verify the duration counter showed elapsed seconds while recording

#### 2. AI Analysis

Tap "Analyze" in the review sheet and check results for these inputs:

| Say this | Expected observations |
|----------|----------------------|
| "He's having a meltdown, throwing toys" | behavior/Meltdown + behavior/Aggressive |
| "He ate lunch well and took his medication" | food/Ate Well + medication/Taken |
| "Log a meltdown" | behavior/Meltdown (inputType = command) |
| "She's overwhelmed by noise at school, shut down" | emotion/Overwhelmed + trigger/Noise + behavior/Shutdown |
| "Good transition to bedtime, slept well" | transitions/Good Transition + sleep/Slept Well |

Each observation card should show:
- Category color dot and label
- Title describing the event
- Confidence badge (percentage)
- Tag chips matching system tags

#### 3. Editing and Re-analysis

- After recording, edit the transcript text in the input field
- Tap "Re-analyze" — new suggestions should reflect the edited text
- Toggle observations on/off with the checkmark button
- Remove observations with the X button

#### 4. Confirm and Save

- Confirm suggestions — a toast should show "N observation(s) logged"
- Switch to the Timeline tab — the new observations should appear with the current timestamp
- Discard instead — nothing should be saved

#### 5. Database Verification

Open browser DevTools console and check the database tables:

```sql
-- Parent observation (entry_type = 'voice')
SELECT * FROM observations WHERE entry_type = 'voice';

-- Voice log with transcript
SELECT * FROM voice_logs;

-- AI audit trail
SELECT * FROM ai_extracted_events;

-- Tags linked to voice observations
SELECT o.title, t.name FROM observations o
JOIN observation_tags ot ON ot.observation_id = o.id
JOIN tag_definitions t ON t.id = ot.tag_id
WHERE o.entry_type = 'voice';
```

#### 6. Error Cases

| Scenario | Expected behavior |
|----------|-------------------|
| Deny microphone permission | Error message: "Microphone access denied" |
| Disconnect network before Analyze | Error message in review sheet |
| Empty speech (hold and release quickly) | "No speech detected" error or empty transcript |
| Invalid/missing API key | Error message: "EXPO_PUBLIC_GROQ_API_KEY is not set" or 401 error |

#### 7. Browser Support Check

In the console, run:
```js
typeof window.webkitSpeechRecognition
// Should return "function" in Chrome
// Returns "undefined" in unsupported browsers
```

---

## Next Steps

### Short Term

- **Tap-to-toggle alternative**: Some users may prefer tap-start / tap-stop over hold-to-speak. Add a setting or detect short taps as toggle mode.
- **Auto-analyze on stop**: Skip the manual "Analyze" button — automatically send transcript to Groq when recording stops, so the review sheet opens with suggestions ready.
- **Transcript confidence indicator**: Web Speech API provides confidence scores per result. Surface low-confidence segments so users know what to double-check.
- **Observation title editing**: Let users edit individual observation titles in the review sheet before confirming.

### Medium Term

- **Offline fallback**: When there's no network, save the transcript with `ai_parse_status = 'pending'` and analyze later when connectivity returns.
- **Audio file storage**: Record actual audio via `expo-av` alongside the Web Speech API transcript. Store the file path in `voice_logs.audio_file_path` for playback and re-transcription.
- **React Native (non-web)**: Web Speech API only works in browsers. For iOS/Android native builds, integrate a speech-to-text library (e.g., `expo-speech-recognition` or `@react-native-voice/voice`).
- **Rate limit handling**: Track Groq API usage (30 RPM free tier) and queue requests if approaching limits.

### Longer Term

- **Whisper integration**: Add Groq's Whisper endpoint as an alternative transcription path for audio files, enabling higher accuracy and multilingual support.
- **Voice history**: Show a list of past voice logs with playback, letting caregivers review what they said.
- **Smart suggestions**: Use past observations to improve AI accuracy — e.g., if the child has specific triggers, bias the model toward those patterns.
- **Multi-language support**: Set `recognition.lang` based on user preference for non-English-speaking families.
