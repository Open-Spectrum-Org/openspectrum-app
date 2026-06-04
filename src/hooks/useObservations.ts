import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import { useChild } from './useChild';
import {
  getObservationsByDate,
  getDaySummary,
  softDeleteObservation,
  undoDeleteObservation,
} from '../db/queries/observations';
import type { ObservationWithTags, DaySummary } from '../types/database';

export function useObservations(date: string) {
  const db = useDatabase();
  const { child } = useChild();
  const [observations, setObservations] = useState<ObservationWithTags[]>([]);
  const [summary, setSummary] = useState<DaySummary>({ sleep: 0, meals: 0, meds: 0, incidents: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const [obs, sum] = await Promise.all([
      getObservationsByDate(db, child.id, date),
      getDaySummary(db, child.id, date),
    ]);
    setObservations(obs);
    setSummary(sum);
    setLoading(false);
  }, [db, child?.id, date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteObservation = useCallback(async (id: string) => {
    await softDeleteObservation(db, id);
    await refresh();
    return id;
  }, [db, refresh]);

  const undoDelete = useCallback(async (id: string) => {
    await undoDeleteObservation(db, id);
    await refresh();
  }, [db, refresh]);

  return { observations, summary, loading, refresh, deleteObservation, undoDelete };
}
