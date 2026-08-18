import { useCallback, useRef, useState } from 'react';
import type { VoiceRecordingState, GroqParsedResult } from '../types/voice';
import { analyzeTranscript } from '../services/groqService';

interface VoiceCaptureReturn {
  state: VoiceRecordingState;
  transcript: string;
  editedTranscript: string;
  durationSeconds: number;
  parsedResult: GroqParsedResult | null;
  error: string | null;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  submitForAnalysis: () => Promise<void>;
  setEditedTranscript: (text: string) => void;
  toggleObservation: (id: string) => void;
  removeObservation: (id: string) => void;
  reset: () => void;
}

export function useVoiceCapture(): VoiceCaptureReturn {
  const [state, setState] = useState<VoiceRecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [parsedResult, setParsedResult] = useState<GroqParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
      : null;

  const isSupported = SpeechRecognitionClass !== null;

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionClass) {
      setError('Speech recognition not supported in this browser');
      setState('error');
      return;
    }

    setError(null);
    setTranscript('');
    setEditedTranscript('');
    setParsedResult(null);
    setDurationSeconds(0);

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!;
        if (result.isFinal) {
          finalTranscript += result[0]!.transcript;
        } else {
          interim += result[0]!.transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied');
      } else if (event.error === 'no-speech') {
        setError('No speech detected');
      } else if (event.error === 'network') {
        setError('Network error during recognition');
      } else {
        setError(`Speech error: ${event.error}`);
      }
      setState('error');
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };

    recognition.onend = () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();

    durationIntervalRef.current = setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    recognition.start();
    setState('recording');
  }, [SpeechRecognitionClass]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setDurationSeconds(duration);
    setState('transcribing');

    setTimeout(() => {
      setTranscript((current) => {
        setEditedTranscript(current);
        return current;
      });
      setState('review');
    }, 300);
  }, []);

  const submitForAnalysis = useCallback(async () => {
    const textToAnalyze = editedTranscript || transcript;
    if (!textToAnalyze.trim()) {
      setError('No transcript to analyze');
      return;
    }

    setState('analyzing');
    setError(null);

    try {
      const result = await analyzeTranscript(textToAnalyze);
      setParsedResult(result);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setState('review');
    }
  }, [editedTranscript, transcript]);

  const toggleObservation = useCallback((id: string) => {
    setParsedResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggestedObservations: prev.suggestedObservations.map((obs) =>
          obs.id === id ? { ...obs, confirmed: !obs.confirmed } : obs
        ),
      };
    });
  }, []);

  const removeObservation = useCallback((id: string) => {
    setParsedResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggestedObservations: prev.suggestedObservations.filter((obs) => obs.id !== id),
      };
    });
  }, []);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setState('idle');
    setTranscript('');
    setEditedTranscript('');
    setDurationSeconds(0);
    setParsedResult(null);
    setError(null);
  }, []);

  return {
    state,
    transcript,
    editedTranscript,
    durationSeconds,
    parsedResult,
    error,
    isSupported,
    startRecording,
    stopRecording,
    submitForAnalysis,
    setEditedTranscript,
    toggleObservation,
    removeObservation,
    reset,
  };
}
