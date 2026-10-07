import type { VoiceRecordingState } from '../types/voice';

interface MicButtonProps {
  onPress: () => void;
  state: VoiceRecordingState;
  durationSeconds: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MicButton({ onPress, state, durationSeconds }: MicButtonProps) {
  const isRecording = state === 'recording';
  const isProcessing = state === 'transcribing' || state === 'analyzing' || state === 'saving';

  const label = isRecording
    ? 'Tap to Stop'
    : isProcessing
      ? state === 'analyzing' ? 'Analyzing...' : 'Processing...'
      : 'Tap to Speak';

  const buttonClasses = [
    'w-12 h-12 rounded-full border-[3px] flex items-center justify-center flex-shrink-0',
    isRecording
      ? 'bg-danger border-danger animate-pulse-mic'
      : isProcessing
        ? 'bg-primary border-primary'
        : 'bg-primary-light border-primary active:opacity-80 active:scale-95 transition-transform',
  ].join(' ');

  return (
    <div className="flex items-center px-4 py-2 gap-3">
      <button
        onClick={isProcessing ? undefined : onPress}
        disabled={isProcessing}
        className={buttonClasses}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-2xl">{isRecording ? '🔴' : '🎙️'}</span>
        )}
      </button>
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${isRecording ? 'text-danger' : 'text-text-secondary'}`}>
          {label}
        </span>
        {isRecording && (
          <span className="text-lg font-bold text-danger tabular-nums">
            {formatDuration(durationSeconds)}
          </span>
        )}
      </div>
    </div>
  );
}
