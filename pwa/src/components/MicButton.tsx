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
    'w-[120px] h-[120px] rounded-full border-[3px] flex items-center justify-center',
    isRecording
      ? 'bg-danger border-danger animate-pulse-mic'
      : isProcessing
        ? 'bg-primary border-primary'
        : 'bg-primary-light border-primary active:opacity-80 active:scale-95 transition-transform',
  ].join(' ');

  return (
    <div className="flex flex-col items-center py-4 gap-2">
      <button
        onClick={isProcessing ? undefined : onPress}
        disabled={isProcessing}
        className={buttonClasses}
      >
        {isProcessing ? (
          <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-5xl">{isRecording ? '🔴' : '🎙️'}</span>
        )}
      </button>
      {isRecording && (
        <span className="text-lg font-semibold text-danger tabular-nums">
          {formatDuration(durationSeconds)}
        </span>
      )}
      <span className={`text-xs ${isRecording ? 'text-danger font-semibold' : 'text-text-secondary'}`}>
        {label}
      </span>
    </div>
  );
}
