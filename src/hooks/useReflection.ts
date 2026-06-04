import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import { useChild } from './useChild';
import { getReflection, upsertReflection } from '../db/queries/reflections';
import { TEST_USER_ID } from '../db/seed';
import type { DailyReflection } from '../types/database';

export function useReflection(date: string) {
  const db = useDatabase();
  const { child } = useChild();
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const r = await getReflection(db, child.id, date);
    setReflection(r);
    setLoading(false);
  }, [db, child?.id, date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setRating = useCallback(async (rating: 'better_than_usual' | 'typical' | 'difficult') => {
    if (!child) return;
    await upsertReflection(db, child.id, TEST_USER_ID, date, rating);
    await refresh();
  }, [db, child?.id, date, refresh]);

  return { reflection, loading, setRating, refresh };
}
