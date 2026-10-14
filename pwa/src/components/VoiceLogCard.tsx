import { useState } from 'react';
import { categoryColor } from '../theme/colors';
import { formatTime } from '../utils/date';
import type { ObservationWithTags } from '../types/database';

interface VoiceLogCardProps {
  parent: ObservationWithTags;
  children: ObservationWithTags[];
  onDelete: (ids: string[]) => void;
}

function displayTime(obs: ObservationWithTags): string {
  if (obs.event_time_precision === 'date_only') return 'Earlier';
  if (obs.event_time_precision === 'approximate') return `~${formatTime(obs.occurred_at)}`;
  return formatTime(obs.occurred_at);
}

export function VoiceLogCard({ parent, children, onDelete }: VoiceLogCardProps) {
  const transcript = parent.title ?? '';
  const summary = parent.notes ?? '';
  const hasBoth = !!transcript && !!summary;
  const [showSummary, setShowSummary] = useState(hasBoth);

  const displayText = hasBoth ? (showSummary ? summary : transcript) : transcript || summary;
  const allIds = [parent.id, ...children.map((c) => c.id)];

  return (
    <div className="flex w-full active:bg-surface border-b border-gray-100">
      <div className="w-1 flex-shrink-0 bg-gray-300" />
      <div className="flex-1 px-3 py-1.5 min-w-0">
        {/* Main row: mic · time · text · delete */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs flex-shrink-0 opacity-50">🎙️</span>
          <span className="text-xs text-text-secondary flex-shrink-0 w-11">{displayTime(parent)}</span>
          <span className="text-sm text-text-primary truncate flex-1 min-w-0 italic opacity-75">
            {displayText}
          </span>
          <button onClick={() => onDelete(allIds)} className="flex-shrink-0 p-0.5 leading-none">
            <span className="text-xs text-text-muted">✕</span>
          </button>
        </div>
        {/* Child observation chips */}
        {children.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {children.map((child) => {
              const color = categoryColor(child.category);
              const label = child.title ?? child.tags.map((t) => t.name).join(', ');
              return (
                <span
                  key={child.id}
                  className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}
        {/* Transcript / summary toggle */}
        {hasBoth && (
          <button onClick={() => setShowSummary((v) => !v)} className="mt-0.5">
            <span className="text-xs text-primary font-medium">
              {showSummary ? 'Show transcript' : 'Show summary'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
