import { useState } from 'react';
import { categoryColor } from '../theme/colors';
import { formatTime } from '../utils/date';
import type { ObservationWithTags } from '../types/database';

interface TimelineCardProps {
  observation: ObservationWithTags;
  onDelete: (id: string) => void;
}

export function TimelineCard({ observation, onDelete }: TimelineCardProps) {
  const barColor = categoryColor(observation.category);
  const tagNames = observation.tags.map((t) => t.name).join(', ');
  const isVoice = observation.entry_type === 'voice' && observation.notes;
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="flex bg-white rounded-[10px] mx-4 my-1 shadow-sm overflow-hidden">
      <div className="w-1" style={{ backgroundColor: barColor }} />
      <div className="flex-1 p-3 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-text-secondary">{formatTime(observation.occurred_at)}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold capitalize" style={{ color: barColor }}>
              {observation.category}
            </span>
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
      </div>
    </div>
  );
}
