import { useMemo } from 'react';
import { QuickTagButton } from './QuickTagButton';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import type { GroupedTags } from '../db/queries/tags';
import type { TagWithCategory } from '../types/database';

interface QuickTagGridProps {
  groups: GroupedTags[];
  onTagPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
  searchQuery?: string;
  onCreateTag: () => void;
}

const CORE_CATEGORIES = ['behavior', 'food', 'medication', 'emotion'];

export function QuickTagGrid({ groups, onTagPress, searchQuery, onCreateTag }: QuickTagGridProps) {
  const { coreGroups, extraGroups } = useMemo(() => {
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

    return { coreGroups: core, extraGroups: extra };
  }, [groups, searchQuery]);

  const showSeparator = coreGroups.length > 0 && extraGroups.length > 0;

  function renderGroup(group: GroupedTags) {
    return (
      <div key={group.category} className="space-y-2">
        <span
          className="text-sm font-semibold capitalize pl-1"
          style={{ color: group.color }}
        >
          {group.category}
        </span>
        <div className="flex flex-wrap">
          {group.tags.map((tag) => (
            <QuickTagButton key={tag.id} tag={tag} onPress={onTagPress} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 space-y-4">
      {coreGroups.map(renderGroup)}

      {showSeparator && <hr className="border-border" />}

      {extraGroups.map(renderGroup)}

      {!searchQuery?.trim() && (
        <button
          onClick={onCreateTag}
          className="w-full py-2.5 rounded-[10px] border border-dashed border-border text-sm font-medium text-text-secondary"
        >
          ＋ Add custom tag
        </button>
      )}
    </div>
  );
}
