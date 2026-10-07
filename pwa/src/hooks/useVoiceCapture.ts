import { useCallback, useRef, useState } from 'react';
import type { VoiceRecordingState, GroqParsedResult } from '../types/voice';
import { transcribeAudio, analyzeTranscript } from '../services/groqService';

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

// ── MediaRecorder helpers (Firefox fallback) ────────────────────────────────

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

function mimeToExtension(mimeType: string): string {
  if (mimeType.startsWith('audio/ogg')) return 'ogg';
  if (mimeType.startsWith('audio/mp4')) return 'mp4';
  return 'webm';
}

// ── Capability detection ────────────────────────────────────────────────────

const SpeechRecognitionClass =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null)
    : null;

const hasMediaRecorder =
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  typeof MediaRecorder !== 'undefined';

// ── Hook ────────────────────────────────────────────────────────────────────

export function useVoiceCapture(): VoiceCaptureReturn {
  const [state, setState] = useState<VoiceRecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [parsedResult, setParsedResult] = useState<GroqParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Web Speech API refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // MediaRecorder refs (Firefox fallback)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported = SpeechRecognitionClass !== null || hasMediaRecorder;

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // ── Web Speech API path ──────────────────────────────────────────────────

  const startWithSpeechRecognition = useCallback(() => {
    const recognition = new SpeechRecognitionClass!();
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
      stopDurationTimer();
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
    };

    recognition.onend = () => {
      stopDurationTimer();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [stopDurationTimer]);

  const stopWithSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopDurationTimer();
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
  }, [stopDurationTimer]);

  // ── MediaRecorder path (Firefox) ─────────────────────────────────────────

  const startWithMediaRecorder = useCallback(() => {
    audioChunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;

        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stopStream();
          stopDurationTimer();
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setDurationSeconds(duration);
          setState('transcribing');

          const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
          const ext = mimeToExtension(mimeType);

          try {
            const text = await transcribeAudio(blob, `recording.${ext}`);
            const trimmed = text.trim();
            setTranscript(trimmed);
            setEditedTranscript(trimmed);
            setState('review');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Transcription failed');
            setState('error');
          }
        };

        recorder.onerror = () => {
          stopStream();
          stopDurationTimer();
          setError('Recording failed');
          setState('error');
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setState('recording');
      })
      .catch((err: unknown) => {
        const name = err instanceof Error ? err.name : '';
        setError(
          name === 'NotAllowedError' || name === 'PermissionDeniedError'
            ? 'Microphone access denied'
            : 'Could not access microphone'
        );
        setState('error');
      });
  }, [stopStream, stopDurationTimer]);

  const stopWithMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError('Microphone recording is not supported in this browser');
      setState('error');
      return;
    }

    setError(null);
    setTranscript('');
    setEditedTranscript('');
    setParsedResult(null);
    setDurationSeconds(0);

    startTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setDurationSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    if (SpeechRecognitionClass) {
      startWithSpeechRecognition();
    } else {
      startWithMediaRecorder();
    }
  }, [isSupported, startWithSpeechRecognition, startWithMediaRecorder]);

  const stopRecording = useCallback(() => {
    if (SpeechRecognitionClass) {
      stopWithSpeechRecognition();
    } else {
      stopWithMediaRecorder();
    }
  }, [stopWithSpeechRecognition, stopWithMediaRecorder]);

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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    stopStream();
    stopDurationTimer();
    setState('idle');
    setTranscript('');
    setEditedTranscript('');
    setDurationSeconds(0);
    setParsedResult(null);
    setError(null);
  }, [stopStream, stopDurationTimer]);

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
