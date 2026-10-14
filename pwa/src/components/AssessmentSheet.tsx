import { useState } from 'react';
import { insertObservationAssessment, updateObservationAssessment } from '../db/queries/assessments';
import type { AssessmentScale } from '../types/database';

type PendingValue =
  | { type: 'numeric'; value: number }
  | { type: 'categorical'; value: string };

interface AssessmentSheetProps {
  visible: boolean;
  observationId: string;
  tagName: string;
  scale: AssessmentScale;
  onClose: () => void;
  // Edit mode — provide these to edit an existing assessment instead of adding a new one
  existingAssessmentId?: string;
  currentNumericValue?: number | null;
  currentCategoricalValue?: string | null;
}

export function AssessmentSheet({
  visible,
  observationId,
  tagName,
  scale,
  onClose,
  existingAssessmentId,
  currentNumericValue,
  currentCategoricalValue,
}: AssessmentSheetProps) {
  const [pendingValue, setPendingValue] = useState<PendingValue | null>(null);

  if (!visible) return null;

  const isEditMode = !!existingAssessmentId;

  const labels: Record<string, string> = (() => {
    try { return scale.labels ? JSON.parse(scale.labels) : {}; }
    catch { return {}; }
  })();

  const options: string[] = (() => {
    try { return scale.options ? JSON.parse(scale.options) : []; }
    catch { return []; }
  })();

  const min = scale.min_value ?? 1;
  const max = scale.max_value ?? 5;
  const numericSteps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  function handleNumericSelect(value: number) {
    if (isEditMode) {
      // Tapping the current value → close with no change
      if (value === currentNumericValue) { onClose(); return; }
      setPendingValue({ type: 'numeric', value });
    } else {
      insertObservationAssessment(observationId, scale.id, { numeric_value: value }).then(onClose);
    }
  }

  function handleCategoricalSelect(value: string) {
    if (isEditMode) {
      if (value === currentCategoricalValue) { onClose(); return; }
      setPendingValue({ type: 'categorical', value });
    } else {
      insertObservationAssessment(observationId, scale.id, { categorical_value: value }).then(onClose);
    }
  }

  async function handleConfirmUpdate() {
    if (!pendingValue || !existingAssessmentId) return;
    if (pendingValue.type === 'numeric') {
      await updateObservationAssessment(existingAssessmentId, { numeric_value: pendingValue.value, categorical_value: null });
    } else {
      await updateObservationAssessment(existingAssessmentId, { categorical_value: pendingValue.value, numeric_value: null });
    }
    onClose();
  }

  // Human-readable label for a value (used in confirmation bar)
  function numericLabel(v: number) {
    return labels[String(v)] ? `${v} — ${labels[String(v)]}` : String(v);
  }

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
        <p className="text-sm text-text-secondary mb-5">
          {isEditMode ? `Edit: ${scale.name}` : scale.name}
        </p>

        {scale.scale_type === 'numeric' ? (
          <div className="flex gap-3 justify-center mb-6">
            {numericSteps.map((n) => {
              const isCurrent = isEditMode && n === currentNumericValue;
              const isPending = pendingValue?.type === 'numeric' && pendingValue.value === n;
              return (
                <div key={n} className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleNumericSelect(n)}
                    className={`w-12 h-12 rounded-[12px] border-2 text-[20px] font-bold active:scale-95 transition-transform
                      ${isPending
                        ? 'border-primary bg-primary text-white'
                        : isCurrent
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface text-text-primary'
                      }`}
                  >
                    {n}
                  </button>
                  {labels[String(n)] ? (
                    <span className="text-[10px] text-text-muted text-center max-w-[48px] leading-tight">
                      {labels[String(n)]}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6">
            {options.map((opt) => {
              const isCurrent = isEditMode && opt === currentCategoricalValue;
              const isPending = pendingValue?.type === 'categorical' && pendingValue.value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleCategoricalSelect(opt)}
                  className={`px-4 py-2.5 rounded-[10px] border text-base font-medium capitalize active:scale-95 transition-transform
                    ${isPending
                      ? 'border-primary bg-primary text-white'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface text-text-primary'
                    }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Confirmation bar — shown only in edit mode after a new value is selected */}
        {pendingValue ? (
          <div className="rounded-[12px] bg-surface-alt border border-border px-4 py-3">
            <p className="text-sm text-text-secondary mb-3">
              {scale.scale_type === 'numeric'
                ? <>Change from <strong>{numericLabel(currentNumericValue!)}</strong> to <strong>{numericLabel((pendingValue as { type: 'numeric'; value: number }).value)}</strong>?</>
                : <>Change from <strong className="capitalize">{currentCategoricalValue}</strong> to <strong className="capitalize">{(pendingValue as { type: 'categorical'; value: string }).value}</strong>?</>
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingValue(null)}
                className="flex-1 py-2.5 rounded-[10px] border border-border text-base font-semibold text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="flex-1 py-2.5 rounded-[10px] bg-primary text-white text-base font-semibold"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[10px] border border-border text-base font-semibold text-text-secondary"
          >
            {isEditMode ? 'No change' : 'Skip'}
          </button>
        )}
      </div>
    </div>
  );
}
