import { useCallback, useEffect, useState } from 'react';
import { useChild } from './useChild';
import {
  getCategoryBreakdown,
  getDailyCounts,
  getTopTags,
  getTotalCount,
  getReflectionSummary,
  getHourlyDistribution,
  getReflectionCorrelation,
  getAssessmentAverages,
  getDayOfWeekPattern,
  getSleepDifficultyLink,
  type CategoryCount,
  type DailyCount,
  type TagCount,
  type ReflectionCount,
  type HourCount,
  type CategoryReflectionCorrelation,
  type AssessmentAverage,
  type DayOfWeekCount,
  type SleepDifficultyLink,
} from '../db/queries/reports';
import { addDays } from '../utils/date';

export interface ReportData {
  totalCount: number;
  categoryBreakdown: CategoryCount[];
  dailyCounts: DailyCount[];
  topTags: TagCount[];
  reflections: ReflectionCount[];
  // Patterns & insights
  priorCategoryBreakdown: CategoryCount[];
  hourlyDistribution: HourCount[];
  dayOfWeekPattern: DayOfWeekCount[];
  reflectionCorrelation: CategoryReflectionCorrelation[];
  assessmentAverages: AssessmentAverage[];
  sleepDifficulty: SleepDifficultyLink;
  priorReflections: ReflectionCount[];
}

export function useReportData(startDate: string, endDate: string, periodDays: number, categories?: string[]) {
  const { child } = useChild();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const priorStart = addDays(startDate, -periodDays);
    const priorEnd = addDays(startDate, -1);

    const [
      totalCount,
      categoryBreakdown,
      dailyCounts,
      topTags,
      reflections,
      priorCategoryBreakdown,
      hourlyDistribution,
      dayOfWeekPattern,
      reflectionCorrelation,
      assessmentAverages,
      sleepDifficulty,
      priorReflections,
    ] = await Promise.all([
      getTotalCount(child.id, startDate, endDate, categories),
      getCategoryBreakdown(child.id, startDate, endDate, categories),
      getDailyCounts(child.id, startDate, endDate, categories),
      getTopTags(child.id, startDate, endDate, 10, categories),
      getReflectionSummary(child.id, startDate, endDate),
      getCategoryBreakdown(child.id, priorStart, priorEnd, categories),
      getHourlyDistribution(child.id, startDate, endDate, categories),
      getDayOfWeekPattern(child.id, startDate, endDate, categories),
      getReflectionCorrelation(child.id, startDate, endDate),
      getAssessmentAverages(child.id, startDate, endDate, categories),
      getSleepDifficultyLink(child.id, startDate, endDate),
      getReflectionSummary(child.id, priorStart, priorEnd),
    ]);

    setData({
      totalCount,
      categoryBreakdown,
      dailyCounts,
      topTags,
      reflections,
      priorCategoryBreakdown,
      hourlyDistribution,
      dayOfWeekPattern,
      reflectionCorrelation,
      assessmentAverages,
      sleepDifficulty,
      priorReflections,
    });
    setLoading(false);
  }, [child?.id, startDate, endDate, periodDays, categories]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
