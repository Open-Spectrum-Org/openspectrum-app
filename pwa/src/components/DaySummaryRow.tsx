import { categoryColor, categoryColorLight } from '../theme';

interface CategoryBadge {
  key: string;
  count: number;
  color: string;
}

interface DaySummaryRowProps {
  categories: CategoryBadge[];
  activeCategories?: Set<string>;
  onToggle?: (category: string) => void;
}

export function DaySummaryRow({ categories, activeCategories, onToggle }: DaySummaryRowProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {categories.map((badge) => {
        const color = categoryColor(badge.key);
        const isActive = activeCategories?.has(badge.key) ?? false;
        return (
          <button
            key={badge.key}
            onClick={() => onToggle?.(badge.key)}
            className="flex-shrink-0 rounded-[10px] py-2 px-3 flex flex-col items-center min-w-[64px] bg-surface"
            style={{
              borderWidth: isActive ? 2 : 1,
              borderStyle: 'solid',
              borderColor: color,
              backgroundColor: isActive ? categoryColorLight(badge.key, 0.15) : undefined,
            }}
          >
            <span className="text-lg font-semibold" style={{ color }}>
              {badge.count}
            </span>
            <span className="text-xs text-text-secondary capitalize">{badge.key}</span>
          </button>
        );
      })}
    </div>
  );
}
