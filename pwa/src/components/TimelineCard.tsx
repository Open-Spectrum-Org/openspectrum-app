import { categoryColor } from '../theme/colors';
import { formatTime } from '../utils/date';
import type { FocusArea, ObservationWithTags, AssessmentWithScale } from '../types/database';

interface TimelineCardProps {
  observation: ObservationWithTags;
  onDelete: (id: string) => void;
  onEditAssessment?: (assessment: AssessmentWithScale, tagName: string) => void;
  activeFocusAreas?: FocusArea[];
  linkedAreaIds?: string[];
  onLinkPress?: () => void;
}

function displayTime(obs: ObservationWithTags): string {
  if (obs.event_time_precision === 'date_only') return 'Earlier';
  if (obs.event_time_precision === 'approximate') return `~${formatTime(obs.occurred_at)}`;
  return formatTime(obs.occurred_at);
}

function AssessmentBadge({
  a,
  onEdit,
}: {
  a: AssessmentWithScale;
  onEdit?: (a: AssessmentWithScale) => void;
}) {
  const { scale, numeric_value, categorical_value } = a;

  let label = '';
  if (scale.scale_type === 'numeric' && numeric_value !== null) {
    label = `${scale.name} ${numeric_value}${scale.max_value != null ? `/${scale.max_value}` : ''}`;
  } else if (categorical_value) {
    label = `${scale.name}: ${categorical_value}`;
  } else {
    return null;
  }

  const baseClass =
    scale.scale_type === 'numeric'
      ? 'text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full'
      : 'text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full';

  if (onEdit) {
    return (
      <button
        onClick={() => onEdit(a)}
        className={`${baseClass} active:opacity-70 active:scale-95 transition-transform inline-flex items-center gap-1`}
      >
        {label}
        <span className="opacity-40 text-[9px]">✎</span>
      </button>
    );
  }

  return <span className={baseClass}>{label}</span>;
}

export function TimelineCard({
  observation,
  onDelete,
  onEditAssessment,
  activeFocusAreas,
  linkedAreaIds,
  onLinkPress,
}: TimelineCardProps) {
  const barColor = categoryColor(observation.category);
  const tagNames = observation.tags.map((t) => t.name).join(', ');
  const assessments = observation.assessments ?? [];
  const showLinkButton = (activeFocusAreas?.length ?? 0) > 0;
  const linkedCount = linkedAreaIds?.length ?? 0;

  const tagLabel = observation.title ?? tagNames;

  function handleEditAssessment(a: AssessmentWithScale) {
    onEditAssessment?.(a, tagLabel);
  }

  return (
    <div className="flex bg-white rounded-[8px] mx-4 my-0.5 shadow-sm overflow-hidden">
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: barColor }} />
      <div className="flex-1 px-2 py-1.5 min-w-0">
        {/* Main row: time · label · assessments · category · actions */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-text-secondary flex-shrink-0 w-11">{displayTime(observation)}</span>
          <span className="text-sm font-medium text-text-primary truncate flex-1 min-w-0">
            {tagLabel}
          </span>
          {assessments.length > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {assessments.map((a) => (
                <AssessmentBadge
                  key={a.id}
                  a={a}
                  onEdit={onEditAssessment ? handleEditAssessment : undefined}
                />
              ))}
            </div>
          )}
          <span className="text-xs font-medium capitalize flex-shrink-0" style={{ color: barColor }}>
            {observation.category}
          </span>
          {showLinkButton && (
            <button onClick={onLinkPress} className="flex-shrink-0 p-0.5 leading-none">
              <span className="text-xs text-text-muted">🎯</span>
            </button>
          )}
          <button
            onClick={() => onDelete(observation.id)}
            className="flex-shrink-0 p-0.5 leading-none"
          >
            <span className="text-xs text-text-muted">✕</span>
          </button>
        </div>
        {/* Secondary row: notes / tags (only when present) */}
        {observation.notes && (
          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{observation.notes}</p>
        )}
        {tagNames && observation.title && (
          <p className="text-xs text-text-muted truncate mt-0.5">{tagNames}</p>
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
