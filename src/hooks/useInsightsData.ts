import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
import { useChild } from './useChild';
import {
  getCategoryBreakdown,
  getDailyCounts,
  getHourlyDistribution,
  getReflectionCorrelation,
  getTotalCount,
  getTopTags,
  type CategoryCount,
  type DailyCount,
  type HourCount,
  type CategoryReflectionCorrelation,
  type TagCount,
} from '../db/queries/reports';

export interface InsightsData {
  totalCount: number;
  categoryBreakdown: CategoryCount[];
  dailyCounts: DailyCount[];
  hourlyDistribution: HourCount[];
  reflectionCorrelation: CategoryReflectionCorrelation[];
  topTags: TagCount[];
}

export function useInsightsData(startDate: string, endDate: string) {
  const db = useDatabase();
  const { child } = useChild();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const [totalCount, categoryBreakdown, dailyCounts, hourlyDistribution, reflectionCorrelation, topTags] =
      await Promise.all([
        getTotalCount(db, child.id, startDate, endDate),
        getCategoryBreakdown(db, child.id, startDate, endDate),
        getDailyCounts(db, child.id, startDate, endDate),
        getHourlyDistribution(db, child.id, startDate, endDate),
        getReflectionCorrelation(db, child.id, startDate, endDate),
        getTopTags(db, child.id, startDate, endDate, 5),
      ]);
    setData({ totalCount, categoryBreakdown, dailyCounts, hourlyDistribution, reflectionCorrelation, topTags });
    setLoading(false);
  }, [db, child?.id, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
