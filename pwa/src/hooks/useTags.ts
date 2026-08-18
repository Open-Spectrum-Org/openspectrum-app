import { useEffect, useState } from 'react';
import { useChild } from './useChild';
import { getEnabledTagsForChild, groupTagsByCategory, type GroupedTags } from '../db/queries/tags';

export function useTags() {
  const { child } = useChild();
  const [groupedTags, setGroupedTags] = useState<GroupedTags[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!child) return;
    setLoading(true);
    getEnabledTagsForChild(child.id).then((tags) => {
      setGroupedTags(groupTagsByCategory(tags));
      setLoading(false);
    });
  }, [child?.id]);

  return { groupedTags, loading };
}
