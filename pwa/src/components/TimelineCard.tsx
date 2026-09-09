import { useState } from 'react';
import { categoryColor } from '../theme/colors';
import { formatTime } from '../utils/date';
import type { FocusArea, ObservationWithTags, AssessmentWithScale } from '../types/database';

interface TimelineCardProps {
  observation: ObservationWithTags;
  onDelete: (id: string) => void;
  activeFocusAreas?: FocusArea[];
  linkedAreaIds?: string[];
  onLinkPress?: () => void;
}

function displayTime(obs: ObservationWithTags): string {
  if (obs.event_time_precision === 'date_only') return 'Earlier';
  if (obs.event_time_precision === 'approximate') return `~${formatTime(obs.occurred_at)}`;
  return formatTime(obs.occurred_at);
}

function AssessmentBadge({ a }: { a: AssessmentWithScale }) {
  const { scale, numeric_value, categorical_value } = a;
  if (scale.scale_type === 'numeric' && numeric_value !== null) {
    const label = `${scale.name} ${numeric_value}${scale.max_value != null ? `/${scale.max_value}` : ''}`;
    return (
      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{label}</span>
    );
  }
  if (categorical_value) {
    return (
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        {scale.name}: {categorical_value}
      </span>
    );
  }
  return null;
}

export function TimelineCard({ observation, onDelete, activeFocusAreas, linkedAreaIds, onLinkPress }: TimelineCardProps) {
  const barColor = categoryColor(observation.category);
  const tagNames = observation.tags.map((t) => t.name).join(', ');
  const isVoice = observation.entry_type === 'voice' && observation.notes;
  const [showSummary, setShowSummary] = useState(false);
  const assessments = observation.assessments ?? [];
  const showLinkButton = (activeFocusAreas?.length ?? 0) > 0;
  const linkedCount = linkedAreaIds?.length ?? 0;

  return (
    <div className="flex bg-white rounded-[10px] mx-4 my-1 shadow-sm overflow-hidden">
      <div className="w-1" style={{ backgroundColor: barColor }} />
      <div className="flex-1 p-3 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary">{displayTime(observation)}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold capitalize" style={{ color: barColor }}>
              {observation.category}
            </span>
            {showLinkButton && (
              <button onClick={onLinkPress} className="p-1">
                <span className="text-xs text-text-muted">🎯</span>
              </button>
            )}
            <button
              onClick={() => onDelete(observation.id)}
              className="p-1"
            >
              <span className="text-xs text-text-muted">✕</span>
            </button>
          </div>
        </div>
        <p className="text-base font-semibold text-text-primary">
          {showSummary ? observation.notes : (observation.title ?? tagNames)}
        </p>
        {isVoice ? (
          <button onClick={() => setShowSummary((v) => !v)} className="self-start py-0.5">
            <span className="text-xs text-primary font-medium">
              {showSummary ? 'Show transcript' : 'Show AI summary'}
            </span>
          </button>
        ) : (
          observation.notes && (
            <p className="text-sm text-text-secondary line-clamp-2">{observation.notes}</p>
          )
        )}
        {tagNames && observation.title && (
          <p className="text-xs text-text-muted">{tagNames}</p>
        )}
        {assessments.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {assessments.map((a) => (
              <AssessmentBadge key={a.id} a={a} />
            ))}
          </div>
        )}
        {linkedCount > 0 && (
          <span className="text-xs text-text-muted">
            🎯 {linkedCount} focus area{linkedCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </div>
  );
}
