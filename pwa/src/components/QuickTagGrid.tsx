import { useMemo, useState } from 'react';
import { QuickTagButton } from './QuickTagButton';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import type { GroupedTags } from '../db/queries/tags';
import type { AssessmentScale, TagWithCategory } from '../types/database';

interface PendingAssessment {
  observationId: string;
  tagName: string;
  category: string;
  scale: AssessmentScale;
}

interface QuickTagGridProps {
  groups: GroupedTags[];
  onTagPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
  searchQuery?: string;
  onCreateTag: () => void;
  pendingAssessment?: PendingAssessment | null;
  onRatingSelect?: (observationId: string, scaleId: string, value: number | string) => void;
  onRatingSkip?: () => void;
}

const CORE_CATEGORIES = ['behavior', 'food', 'medication', 'emotion'];

export function QuickTagGrid({
  groups,
  onTagPress,
  searchQuery,
  onCreateTag,
  pendingAssessment,
  onRatingSelect,
  onRatingSkip,
}: QuickTagGridProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const allGroups = useMemo(() => {
    const applySearch = (g: GroupedTags) =>
      searchQuery?.trim()
        ? { ...g, tags: g.tags.filter((tag) => tagMatchesQuery(tag.name, searchQuery)) }
        : g;

    const core = CORE_CATEGORIES
      .map((cat) => groups.find((g) => g.category === cat))
      .filter((g): g is GroupedTags => g !== undefined)
      .map(applySearch)
      .filter((g) => g.tags.length > 0);

    const extra = groups
      .filter((g) => !CORE_CATEGORIES.includes(g.category))
      .sort((a, b) => a.category.localeCompare(b.category))
      .map(applySearch)
      .filter((g) => g.tags.length > 0);

    return [...core, ...extra];
  }, [groups, searchQuery]);

  const isExpanded = (category: string) =>
    searchQuery?.trim() ? true : expandedCategory === category;

  const toggle = (category: string) => {
    // Collapsing a category that has a pending rating counts as skip
    if (expandedCategory === category && pendingAssessment?.category === category) {
      onRatingSkip?.();
    }
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  // Split into pairs for 2-column layout
  const pairs: [GroupedTags, GroupedTags | undefined][] = [];
  for (let i = 0; i < allGroups.length; i += 2) {
    pairs.push([allGroups[i]!, allGroups[i + 1]]);
  }

  function CategoryHeader({ group }: { group: GroupedTags }) {
    const expanded = isExpanded(group.category);
    const r = parseInt(group.color.slice(1, 3), 16);
    const g = parseInt(group.color.slice(3, 5), 16);
    const b = parseInt(group.color.slice(5, 7), 16);
    const bgColor = `rgba(${r}, ${g}, ${b}, 0.1)`;

    return (
      <button
        onClick={() => toggle(group.category)}
        className="flex-1 flex items-center gap-2 py-2 px-3 rounded-full border-2 min-w-0 active:opacity-70 transition-opacity"
        style={{ borderColor: group.color, backgroundColor: bgColor }}
        aria-expanded={expanded}
      >
        <span
          className="flex-1 text-sm font-semibold capitalize truncate"
          style={{ color: group.color }}
        >
          {group.category}
        </span>
        <span className="text-xs flex-shrink-0" style={{ color: group.color }}>
          {group.tags.length} {expanded ? '▲' : '▼'}
        </span>
      </button>
    );
  }

  function PillRow({ group }: { group: GroupedTags }) {
    return (
      <div className="flex flex-wrap pb-2 px-1">
        {group.tags.map((tag) => (
          <QuickTagButton key={tag.id} tag={tag} onPress={onTagPress} />
        ))}
      </div>
    );
  }

  function InlineRatingPills({ assessment }: { assessment: PendingAssessment }) {
    const { scale, observationId, tagName } = assessment;
    const min = scale.min_value ?? 1;
    const max = scale.max_value ?? 5;
    const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const labels: Record<string, string> = (() => {
      try { return JSON.parse(scale.labels ?? '{}'); } catch { return {}; }
    })();
    const options: string[] = (() => {
      try { return JSON.parse(scale.options ?? '[]'); } catch { return []; }
    })();

    return (
      <div className="px-1 pb-3 space-y-2 border-t border-border pt-2 mt-1">
        <p className="text-xs font-medium text-text-secondary px-1">
          Rate: <span className="font-semibold text-text-primary">{tagName}</span>
        </p>
        <div className="flex flex-wrap gap-2 items-start">
          {scale.scale_type === 'numeric'
            ? steps.map((n) => (
                <button
                  key={n}
                  onClick={() => onRatingSelect?.(observationId, scale.id, n)}
                  className="flex flex-col items-center px-3 py-1.5 rounded-full border-2 border-primary bg-primary-light active:opacity-70 transition-opacity min-w-[40px]"
                >
                  <span className="text-sm font-bold text-primary">{n}</span>
                  {labels[String(n)] && (
                    <span className="text-[9px] text-primary leading-tight text-center">
                      {labels[String(n)]}
                    </span>
                  )}
                </button>
              ))
            : options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onRatingSelect?.(observationId, scale.id, opt)}
                  className="px-3 py-1.5 rounded-full border-2 border-primary bg-primary-light text-sm font-medium text-primary capitalize active:opacity-70 transition-opacity"
                >
                  {opt}
                </button>
              ))
          }
          <button
            onClick={() => onRatingSkip?.()}
            className="px-3 py-1.5 rounded-full border border-border text-sm font-medium text-text-secondary active:opacity-70 transition-opacity"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3">
      {pairs.map(([left, right], i) => (
        <div key={i}>
          <div className="flex gap-1">
            <CategoryHeader group={left} />
            {right ? <CategoryHeader group={right} /> : <div className="flex-1" />}
          </div>
          {isExpanded(left.category) && (
            <>
              <PillRow group={left} />
              {pendingAssessment?.category === left.category && (
                <InlineRatingPills assessment={pendingAssessment} />
              )}
            </>
          )}
          {right && isExpanded(right.category) && (
            <>
              <PillRow group={right} />
              {pendingAssessment?.category === right.category && (
                <InlineRatingPills assessment={pendingAssessment} />
              )}
            </>
          )}
        </div>
      ))}

      {!searchQuery?.trim() && (
        <button
          onClick={onCreateTag}
          className="w-full py-2.5 rounded-[10px] border border-dashed border-border text-sm font-medium text-text-secondary mt-2"
        >
          ＋ Add custom tag
        </button>
      )}
    </div>
  );
}
