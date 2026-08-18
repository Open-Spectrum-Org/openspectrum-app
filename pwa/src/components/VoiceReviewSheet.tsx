import { colors, categoryColor, categoryColorLight } from '../theme';
import type { GroqParsedResult, SuggestedObservation } from '../types/voice';

interface VoiceReviewSheetProps {
  visible: boolean;
  transcript: string;
  parsedResult: GroqParsedResult | null;
  error: string | null;
  isAnalyzing: boolean;
  onChangeTranscript: (text: string) => void;
  onReanalyze: () => void;
  onToggleObservation: (id: string) => void;
  onRemoveObservation: (id: string) => void;
  onConfirm: () => void;
  onDiscard: () => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const badgeColor = confidence >= 0.7 ? colors.success : colors.warning;
  return (
    <span
      className="px-1 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: badgeColor + '20', color: badgeColor }}
    >
      {pct}%
    </span>
  );
}

function ObservationCard({
  observation,
  onToggle,
  onRemove,
}: {
  observation: SuggestedObservation;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const catColor = categoryColor(observation.category);

  return (
    <div
      className="bg-surface rounded-2xl p-3 border border-border"
      style={{ opacity: observation.confirmed ? 1 : 0.5 }}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
          <span className="text-xs text-text-secondary capitalize">{observation.category}</span>
          <ConfidenceBadge confidence={observation.confidence} />
        </div>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center"
          >
            <span className="text-sm font-semibold text-success">
              {observation.confirmed ? '✓' : '○'}
            </span>
          </button>
          <button
            onClick={onRemove}
            className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center"
          >
            <span className="text-sm font-semibold text-danger">✕</span>
          </button>
        </div>
      </div>
      <p className="text-base text-text-primary">{observation.title}</p>
      {observation.tagNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {observation.tagNames.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: categoryColorLight(observation.category),
                color: catColor,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function VoiceReviewSheet({
  visible,
  transcript,
  parsedResult,
  error,
  isAnalyzing,
  onChangeTranscript,
  onReanalyze,
  onToggleObservation,
  onRemoveObservation,
  onConfirm,
  onDiscard,
}: VoiceReviewSheetProps) {
  if (!visible) return null;

  const confirmedCount = parsedResult?.suggestedObservations.filter((o) => o.confirmed).length ?? 0;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-border">
        <h2 className="text-[22px] font-semibold text-text-primary">Voice Log</h2>
        <button
          onClick={onDiscard}
          className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center"
        >
          <span className="text-base text-text-secondary">✕</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <span className="text-sm font-semibold text-text-secondary mt-2">Transcript</span>
        <textarea
          value={transcript}
          onChange={(e) => onChangeTranscript(e.target.value)}
          placeholder="Your speech will appear here..."
          className="w-full text-base text-text-primary bg-surface border border-border rounded-[10px] p-3 min-h-[80px] resize-y outline-none placeholder:text-text-muted"
        />
        <button
          onClick={onReanalyze}
          disabled={isAnalyzing}
          className="self-start px-4 py-2 bg-primary-light rounded-[10px] text-base font-semibold text-primary disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : parsedResult ? 'Re-analyze' : 'Analyze'}
        </button>

        {error && (
          <div className="bg-danger-light rounded-[10px] p-3">
            <span className="text-sm text-danger">{error}</span>
          </div>
        )}

        {parsedResult && (
          <>
            <p className="text-base text-text-secondary italic">{parsedResult.summary}</p>

            <span className="text-sm font-semibold text-text-secondary mt-2">
              Suggested Observations ({parsedResult.suggestedObservations.length})
            </span>
            {parsedResult.suggestedObservations.map((obs) => (
              <ObservationCard
                key={obs.id}
                observation={obs}
                onToggle={() => onToggleObservation(obs.id)}
                onRemove={() => onRemoveObservation(obs.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 p-4 border-t border-border">
        <button
          onClick={onDiscard}
          className="flex-1 py-3 rounded-[10px] bg-surface-alt text-center"
        >
          <span className="text-base font-semibold text-text-secondary">Discard</span>
        </button>
        <button
          onClick={onConfirm}
          disabled={confirmedCount === 0}
          className="flex-[2] py-3 rounded-[10px] bg-primary text-center disabled:opacity-50"
        >
          <span className="text-base font-semibold text-white">
            Confirm{confirmedCount > 0 ? ` (${confirmedCount})` : ''}
          </span>
        </button>
      </div>
    </div>
  );
}
