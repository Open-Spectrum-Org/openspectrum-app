import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import {
  getCategoryBreakdown,
  getDailyCounts,
  getTopTags,
  getTotalCount,
  getReflectionSummary,
  type CategoryCount,
  type DailyCount,
  type TagCount,
  type ReflectionCount,
} from '../db/queries/reports';

export interface ReportData {
  totalCount: number;
  categoryBreakdown: CategoryCount[];
  dailyCounts: DailyCount[];
  topTags: TagCount[];
  reflections: ReflectionCount[];
}

export function useReportData(startDate: string, endDate: string) {
  const { child } = useChild();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const [totalCount, categoryBreakdown, dailyCounts, topTags, reflections] = await Promise.all([
      getTotalCount(child.id, startDate, endDate),
      getCategoryBreakdown(child.id, startDate, endDate),
      getDailyCounts(child.id, startDate, endDate),
      getTopTags(child.id, startDate, endDate),
      getReflectionSummary(child.id, startDate, endDate),
    ]);
    setData({ totalCount, categoryBreakdown, dailyCounts, topTags, reflections });
    setLoading(false);
  }, [child?.id, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
