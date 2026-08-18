import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import {
  getObservationsByDate,
  getDaySummary,
  softDeleteObservation,
  undoDeleteObservation,
} from '../db/queries/observations';
import type { ObservationWithTags, DaySummary } from '../types/database';

export function useObservations(date: string) {
  const { child } = useChild();
  const [observations, setObservations] = useState<ObservationWithTags[]>([]);
  const [summary, setSummary] = useState<DaySummary>({ behavior: 0, emotion: 0, food: 0, medication: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const [obs, sum] = await Promise.all([
      getObservationsByDate(child.id, date),
      getDaySummary(child.id, date),
    ]);
    setObservations(obs);
    setSummary(sum);
    setLoading(false);
  }, [child?.id, date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteObservation = useCallback(async (id: string) => {
    await softDeleteObservation(id);
    await refresh();
    return id;
  }, [refresh]);

  const undoDelete = useCallback(async (id: string) => {
    await undoDeleteObservation(id);
    await refresh();
  }, [refresh]);

  return { observations, summary, loading, refresh, deleteObservation, undoDelete };
}
