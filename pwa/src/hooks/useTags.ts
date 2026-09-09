import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import { getEnabledTagsForChild, groupTagsByCategory, type GroupedTags } from '../db/queries/tags';
import { getUsageCounts } from '../utils/tagUsage';

export function useTags() {
  const { child } = useChild();
  const [groupedTags, setGroupedTags] = useState<GroupedTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!child) return;
    setLoading(true);
    getEnabledTagsForChild(child.id).then((tags) => {
      const counts = getUsageCounts(child.id);
      const grouped = groupTagsByCategory(tags).map((group) => ({
        ...group,
        tags: [...group.tags].sort((a, b) => {
          const countDiff = (counts[b.id] ?? 0) - (counts[a.id] ?? 0);
          if (countDiff !== 0) return countDiff;
          return a.display_order - b.display_order;
        }),
      }));
      setGroupedTags(grouped);
      setLoading(false);
    });
  }, [child?.id, tick]);

  return { groupedTags, loading, refresh };
}
