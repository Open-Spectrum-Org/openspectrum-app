import { useCallback, useEffect, useState } from 'react';
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
  const { child } = useChild();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const [totalCount, categoryBreakdown, dailyCounts, hourlyDistribution, reflectionCorrelation, topTags] =
      await Promise.all([
        getTotalCount(child.id, startDate, endDate),
        getCategoryBreakdown(child.id, startDate, endDate),
        getDailyCounts(child.id, startDate, endDate),
        getHourlyDistribution(child.id, startDate, endDate),
        getReflectionCorrelation(child.id, startDate, endDate),
        getTopTags(child.id, startDate, endDate, 5),
      ]);
    setData({ totalCount, categoryBreakdown, dailyCounts, hourlyDistribution, reflectionCorrelation, topTags });
    setLoading(false);
  }, [child?.id, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
