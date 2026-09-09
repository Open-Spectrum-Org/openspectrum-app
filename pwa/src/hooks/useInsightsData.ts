import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import {
  getCategoryBreakdown,
  getDailyCounts,
  getHourlyDistribution,
  getReflectionCorrelation,
  getTotalCount,
  getTopTags,
  getAssessmentAverages,
  getDayOfWeekPattern,
  type CategoryCount,
  type DailyCount,
  type HourCount,
  type CategoryReflectionCorrelation,
  type TagCount,
  type AssessmentAverage,
  type DayOfWeekCount,
} from '../db/queries/reports';
import { addDays } from '../utils/date';

export interface InsightsData {
  totalCount: number;
  categoryBreakdown: CategoryCount[];
  dailyCounts: DailyCount[];
  hourlyDistribution: HourCount[];
  reflectionCorrelation: CategoryReflectionCorrelation[];
  topTags: TagCount[];
  // Phase 5: baselines, comparisons, patterns
  priorCategoryBreakdown: CategoryCount[];
  assessmentAverages: AssessmentAverage[];
  dayOfWeekPattern: DayOfWeekCount[];
}

export function useInsightsData(startDate: string, endDate: string, periodDays: number) {
  const { child } = useChild();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);

    const priorEnd = addDays(startDate, -1);
    const priorStart = addDays(startDate, -periodDays);

    const [
      totalCount,
      categoryBreakdown,
      dailyCounts,
      hourlyDistribution,
      reflectionCorrelation,
      topTags,
      priorCategoryBreakdown,
      assessmentAverages,
      dayOfWeekPattern,
    ] = await Promise.all([
      getTotalCount(child.id, startDate, endDate),
      getCategoryBreakdown(child.id, startDate, endDate),
      getDailyCounts(child.id, startDate, endDate),
      getHourlyDistribution(child.id, startDate, endDate),
      getReflectionCorrelation(child.id, startDate, endDate),
      getTopTags(child.id, startDate, endDate, 5),
      getCategoryBreakdown(child.id, priorStart, priorEnd),
      getAssessmentAverages(child.id, startDate, endDate),
      getDayOfWeekPattern(child.id, startDate, endDate),
    ]);

    setData({
      totalCount,
      categoryBreakdown,
      dailyCounts,
      hourlyDistribution,
      reflectionCorrelation,
      topTags,
      priorCategoryBreakdown,
      assessmentAverages,
      dayOfWeekPattern,
    });
    setLoading(false);
  }, [child?.id, startDate, endDate, periodDays]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
