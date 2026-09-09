import { categoryColor } from '../theme/colors';
import { formatTime } from '../utils/date';
import type { ObservationWithTags } from '../types/database';

interface TimelineRowProps {
  observation: ObservationWithTags;
  onTap: (date: string) => void;
}

function displayTime(obs: ObservationWithTags): string {
  if (obs.event_time_precision === 'date_only') return 'Earlier';
  if (obs.event_time_precision === 'approximate') return `~${formatTime(obs.occurred_at)}`;
  return formatTime(obs.occurred_at);
}

export function TimelineRow({ observation, onTap }: TimelineRowProps) {
  const color = categoryColor(observation.category);
  const date = observation.occurred_at.split('T')[0]!;
  const tagNames = observation.tags.map((t) => t.name).join(', ');
  const label = observation.title ?? tagNames ?? observation.category;

  const firstAssessment = observation.assessments?.[0];
  let badgeText: string | null = null;
  if (firstAssessment) {
    const { scale, numeric_value, categorical_value } = firstAssessment;
    if (scale.scale_type === 'numeric' && numeric_value !== null) {
      badgeText = `★ ${numeric_value}${scale.max_value != null ? `/${scale.max_value}` : ''}`;
    } else if (categorical_value) {
      badgeText = categorical_value;
    }
  }

  return (
    <button
      className="flex items-center gap-2 px-4 py-1.5 w-full text-left active:bg-surface"
      onClick={() => onTap(date)}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-text-secondary w-14 flex-shrink-0">{displayTime(observation)}</span>
      <span className="text-sm text-text-primary flex-1 truncate">
        <span className="capitalize" style={{ color }}>{observation.category}</span>
        {' · '}
        {label}
      </span>
      {badgeText && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {badgeText}
        </span>
      )}
    </button>
  );
}
