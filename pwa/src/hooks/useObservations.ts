import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import {
  getObservationsByDate,
  softDeleteObservation,
  undoDeleteObservation,
} from '../db/queries/observations';
import type { ObservationWithTags } from '../types/database';

export function useObservations(date: string) {
  const { child } = useChild();
  const [observations, setObservations] = useState<ObservationWithTags[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const obs = await getObservationsByDate(child.id, date);
    setObservations(obs);
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

  return { observations, loading, refresh, deleteObservation, undoDelete };
}
