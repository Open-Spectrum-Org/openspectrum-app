import { colors, categoryColorLight } from '../theme';
import type { DaySummary } from '../types/database';

interface DaySummaryRowProps {
  summary: DaySummary;
  activeCategories?: Set<string>;
  onToggle?: (category: string) => void;
}

const badges = [
  { key: 'behavior' as const, label: 'Behavior', emoji: '⚡', color: colors.behavior },
  { key: 'emotion' as const, label: 'Emotion', emoji: '😊', color: colors.emotion },
  { key: 'food' as const, label: 'Food', emoji: '🍽️', color: colors.food },
  { key: 'medication' as const, label: 'Medication', emoji: '💊', color: colors.medication },
];

export function DaySummaryRow({ summary, activeCategories, onToggle }: DaySummaryRowProps) {
  return (
    <div className="flex gap-2 px-4 py-2">
      {badges.map((badge) => {
        const isActive = activeCategories?.has(badge.key) ?? false;
        return (
          <button
            key={badge.key}
            onClick={() => onToggle?.(badge.key)}
            className="flex-1 rounded-[10px] py-2 flex flex-col items-center bg-surface"
            style={{
              borderWidth: isActive ? 2 : 1,
              borderStyle: 'solid',
              borderColor: badge.color,
              backgroundColor: isActive ? categoryColorLight(badge.key, 0.15) : undefined,
            }}
          >
            <span className="text-lg">{badge.emoji}</span>
            <span className="text-lg font-semibold" style={{ color: badge.color }}>
              {summary[badge.key]}
            </span>
            <span className="text-xs text-text-secondary">{badge.label}</span>
          </button>
        );
      })}
    </div>
  );
}
