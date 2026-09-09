import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import { getObservationsByDateRange } from '../db/queries/observations';
import { addDays } from '../utils/date';
import type { ObservationWithTags } from '../types/database';

export interface DayData {
  date: string;
  observations: ObservationWithTags[];
}

export function useWeekObservations(endDate: string) {
  const { child } = useChild();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);

    const startDate = addDays(endDate, -6);
    const allObs = await getObservationsByDateRange(child.id, startDate, endDate);

    // Group by date (extract date portion of occurred_at)
    const byDate: Record<string, ObservationWithTags[]> = {};
    for (const obs of allObs) {
      const d = obs.occurred_at.split('T')[0]!;
      if (!byDate[d]) byDate[d] = [];
      byDate[d]!.push(obs);
    }

    // Build 7 days newest-first
    const result: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(endDate, -i);
      result.push({ date: d, observations: byDate[d] ?? [] });
    }

    setDays(result);
    setLoading(false);
  }, [child?.id, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { days, loading, refresh };
}
