import { insertObservationAssessment } from '../db/queries/assessments';
import type { AssessmentScale } from '../types/database';

interface AssessmentSheetProps {
  visible: boolean;
  observationId: string;
  tagName: string;
  scale: AssessmentScale;
  onClose: () => void;
}

export function AssessmentSheet({
  visible,
  observationId,
  tagName,
  scale,
  onClose,
}: AssessmentSheetProps) {
  if (!visible) return null;

  async function handleNumeric(value: number) {
    await insertObservationAssessment(observationId, scale.id, { numeric_value: value });
    onClose();
  }

  async function handleCategorical(value: string) {
    await insertObservationAssessment(observationId, scale.id, { categorical_value: value });
    onClose();
  }

  const labels: Record<string, string> = (() => {
    try {
      return scale.labels ? JSON.parse(scale.labels) : {};
    } catch {
      return {};
    }
  })();

  const options: string[] = (() => {
    try {
      return scale.options ? JSON.parse(scale.options) : [];
    } catch {
      return [];
    }
  })();

  const min = scale.min_value ?? 1;
  const max = scale.max_value ?? 5;
  const numericSteps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-[20px] px-4 pt-4 pb-8">
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex justify-between items-center mb-1">
          <h2 className="text-[18px] font-semibold text-text-primary">{tagName}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center"
          >
            <span className="text-base text-text-secondary">✕</span>
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-5">{scale.name}</p>

        {scale.scale_type === 'numeric' ? (
          <div className="flex gap-3 justify-center mb-6">
            {numericSteps.map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => handleNumeric(n)}
                  className="w-12 h-12 rounded-[12px] border-2 border-border bg-surface text-[20px] font-bold text-text-primary active:scale-95 transition-transform"
                >
                  {n}
                </button>
                {labels[String(n)] ? (
                  <span className="text-[10px] text-text-muted text-center max-w-[48px] leading-tight">
                    {labels[String(n)]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleCategorical(opt)}
                className="px-4 py-2.5 rounded-[10px] border border-border bg-surface text-base font-medium text-text-primary capitalize active:scale-95 transition-transform"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-[10px] border border-border text-base font-semibold text-text-secondary"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
