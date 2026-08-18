export type VoiceRecordingState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'analyzing'
  | 'review'
  | 'saving'
  | 'error';

export interface SuggestedObservation {
  id: string;
  category: string;
  title: string;
  tagNames: string[];
  confidence: number;
  confirmed: boolean;
}

export interface GroqParsedResult {
  inputType: 'behavior_log' | 'command';
  summary: string;
  suggestedObservations: SuggestedObservation[];
}

export interface VoiceCaptureState {
  state: VoiceRecordingState;
  transcript: string;
  editedTranscript: string;
  durationSeconds: number;
  parsedResult: GroqParsedResult | null;
  error: string | null;
}
