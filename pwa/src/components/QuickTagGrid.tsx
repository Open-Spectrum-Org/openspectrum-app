import { useMemo } from 'react';
import { QuickTagButton } from './QuickTagButton';
import { tagMatchesQuery } from '../utils/tagSynonyms';
import type { GroupedTags } from '../db/queries/tags';
import type { TagWithCategory } from '../types/database';

interface QuickTagGridProps {
  groups: GroupedTags[];
  onTagPress: (tag: TagWithCategory, position: { x: number; y: number }) => void;
  searchQuery?: string;
}

const QUICK_CAPTURE_CATEGORIES = ['behavior', 'food', 'medication', 'emotion'];

export function QuickTagGrid({ groups, onTagPress, searchQuery }: QuickTagGridProps) {
  const filteredGroups = useMemo(() => {
    const sorted = groups
      .filter((g) => QUICK_CAPTURE_CATEGORIES.includes(g.category))
      .sort((a, b) => QUICK_CAPTURE_CATEGORIES.indexOf(a.category) - QUICK_CAPTURE_CATEGORIES.indexOf(b.category));

    if (!searchQuery?.trim()) return sorted;

    return sorted
      .map((group) => ({
        ...group,
        tags: group.tags.filter((tag) => tagMatchesQuery(tag.name, searchQuery)),
      }))
      .filter((group) => group.tags.length > 0);
  }, [groups, searchQuery]);

  return (
    <div className="px-3 space-y-4">
      {filteredGroups.map((group) => (
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
      ))}
    </div>
  );
}
