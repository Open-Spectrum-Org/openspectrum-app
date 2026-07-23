import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from './useDatabase';
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
  const db = useDatabase();
  const { child } = useChild();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const [totalCount, categoryBreakdown, dailyCounts, topTags, reflections] = await Promise.all([
      getTotalCount(db, child.id, startDate, endDate),
      getCategoryBreakdown(db, child.id, startDate, endDate),
      getDailyCounts(db, child.id, startDate, endDate),
      getTopTags(db, child.id, startDate, endDate),
      getReflectionSummary(db, child.id, startDate, endDate),
    ]);
    setData({ totalCount, categoryBreakdown, dailyCounts, topTags, reflections });
    setLoading(false);
  }, [db, child?.id, startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
