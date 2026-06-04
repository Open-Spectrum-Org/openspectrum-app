import { useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import { useChild } from './useChild';
import { getEnabledTagsForChild, groupTagsByCategory, type GroupedTags } from '../db/queries/tags';

export function useTags() {
  const db = useDatabase();
  const { child } = useChild();
  const [groupedTags, setGroupedTags] = useState<GroupedTags[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!child) return;
    setLoading(true);
    getEnabledTagsForChild(db, child.id).then((tags) => {
      setGroupedTags(groupTagsByCategory(tags));
      setLoading(false);
    });
  }, [db, child?.id]);

  return { groupedTags, loading };
}
