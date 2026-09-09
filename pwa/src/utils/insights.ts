/**
 * Pure, synchronous rules engine for Phase 5 intelligence.
 * No DB calls, no React — accepts plain data objects and returns
 * human-readable hypotheses and contextual prompts.
 */

export interface Hypothesis {
  id: string;
  text: string;
  icon: string;
}

export interface ContextualPrompt {
  id: string;
  text: string;
}

interface HypothesisInput {
  totalCount: number;
  categoryBreakdown: { category: string; count: number }[];
  priorCategoryBreakdown: { category: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  reflectionCorrelation: { rating: string; avgObservations: number }[];
  topTags: { name: string; category: string; count: number }[];
  dayOfWeekPattern: { dayIndex: number; dayLabel: string; count: number }[];
  assessmentAverages: {
    scaleName: string;
    scaleType: string;
    avg: number | null;
    maxValue: number | null;
    count: number;
  }[];
  dailyCounts: { date: string; count: number }[];
}

/**
 * Generate up to 5 text-based hypotheses from observation data.
 * Every rule is guarded against sparse data.
 */
export function generateHypotheses(data: HypothesisInput): Hypothesis[] {
  const results: Hypothesis[] = [];

  const catMap = new Map(data.categoryBreakdown.map((c) => [c.category, c.count]));
  const priorTotal = data.priorCategoryBreakdown.reduce((s, c) => s + c.count, 0);

  // 1. Activity spike / drop vs prior period
  if (priorTotal >= 3 && data.totalCount > 0) {
    const changePct = Math.round(((data.totalCount - priorTotal) / priorTotal) * 100);
    if (changePct >= 30) {
      results.push({
        id: 'activity-spike',
        icon: '📈',
        text: `Logging activity is up ${changePct}% compared to the previous period. This may reflect a busier or more challenging stretch.`,
      });
    } else if (changePct <= -30) {
      results.push({
        id: 'activity-drop',
        icon: '📉',
        text: `Fewer observations this period than the previous one (${Math.abs(changePct)}% fewer). This may reflect a calmer time or a gap in logging.`,
      });
    }
  }

  // 2. Difficult days correlate with higher observation load
  const difficultCorr = data.reflectionCorrelation.find((r) => r.rating === 'difficult');
  const typicalCorr = data.reflectionCorrelation.find((r) => r.rating === 'typical');
  if (
    difficultCorr &&
    typicalCorr &&
    typicalCorr.avgObservations > 0 &&
    difficultCorr.avgObservations > typicalCorr.avgObservations * 1.4
  ) {
    const uplift = Math.round(
      ((difficultCorr.avgObservations - typicalCorr.avgObservations) /
        typicalCorr.avgObservations) *
        100
    );
    results.push({
      id: 'difficult-day-load',
      icon: '😟',
      text: `Difficult days tend to have ${uplift}% more logged events than typical days (avg ${difficultCorr.avgObservations} vs ${typicalCorr.avgObservations}).`,
    });
  }

  // 3. Time-of-day concentration
  if (data.totalCount >= 5) {
    const morning = data.hourlyDistribution
      .filter((h) => h.hour >= 6 && h.hour < 12)
      .reduce((s, h) => s + h.count, 0);
    const afternoon = data.hourlyDistribution
      .filter((h) => h.hour >= 12 && h.hour < 18)
      .reduce((s, h) => s + h.count, 0);
    const evening = data.hourlyDistribution
      .filter((h) => h.hour >= 18)
      .reduce((s, h) => s + h.count, 0);

    if (morning > afternoon * 1.5 && morning > evening * 1.5) {
      results.push({
        id: 'morning-peak',
        icon: '🌅',
        text: 'Most observations occur in the morning hours. Morning routines may be a particularly eventful or challenging time.',
      });
    } else if (evening > morning * 1.5 && evening > afternoon * 1.2) {
      results.push({
        id: 'evening-peak',
        icon: '🌙',
        text: 'Evening hours show the highest activity. Wind-down routines or pre-sleep patterns may be worth tracking more closely.',
      });
    }
  }

  // 4. Weekday vs weekend pattern
  if (data.totalCount >= 10 && data.dayOfWeekPattern.length === 7) {
    const weekdayTotal = data.dayOfWeekPattern
      .filter((d) => d.dayIndex >= 1 && d.dayIndex <= 5)
      .reduce((s, d) => s + d.count, 0);
    const weekendTotal = data.dayOfWeekPattern
      .filter((d) => d.dayIndex === 0 || d.dayIndex === 6)
      .reduce((s, d) => s + d.count, 0);
    const weekdayAvg = weekdayTotal / 5;
    const weekendAvg = weekendTotal / 2;

    if (weekdayAvg > 0 && weekendAvg > weekdayAvg * 1.5) {
      results.push({
        id: 'weekend-spike',
        icon: '🏡',
        text: 'Weekends have significantly more observations on average. Changes in routine or structure at home may be a factor worth exploring.',
      });
    } else if (weekendAvg >= 0 && weekdayAvg > weekendAvg * 1.5) {
      results.push({
        id: 'weekday-spike',
        icon: '🏫',
        text: 'Weekdays show higher observation counts than weekends. School days or structured activity may be driving increased activity.',
      });
    }
  }

  // 5. Behavior events far outnumber successes
  const behaviorCount = catMap.get('behavior') ?? 0;
  const successCount = catMap.get('successes') ?? 0;
  if (behaviorCount >= 5 && successCount < behaviorCount * 0.25) {
    results.push({
      id: 'success-gap',
      icon: '🌟',
      text: `Behavior events (${behaviorCount}) outnumber successes (${successCount}) by a wide margin. Logging positive moments can help identify what strategies are working.`,
    });
  }

  // 6. Triggers and behavior appear together
  const hasTrigger = data.topTags.some((t) => t.category === 'trigger');
  const hasBehavior = data.topTags.some((t) => t.category === 'behavior');
  if (hasTrigger && hasBehavior) {
    results.push({
      id: 'trigger-behavior',
      icon: '⚡',
      text: 'Both triggers and behavior events appear frequently. Comparing their timestamps may reveal which triggers tend to precede difficult behavior.',
    });
  }

  // 7. Sleep not being tracked
  const sleepCount = catMap.get('sleep') ?? 0;
  const rangeDays = Math.max(data.dailyCounts.length, 1);
  if (data.totalCount >= 5 && sleepCount / rangeDays < 0.3) {
    results.push({
      id: 'sleep-gaps',
      icon: '😴',
      text: "Sleep has not been logged frequently this period. Sleep patterns often correlate with mood and behavior — consistent tracking can reveal important connections.",
    });
  }

  // 8. Assessment score note (first numeric scale with enough ratings)
  for (const a of data.assessmentAverages) {
    if (a.scaleType === 'numeric' && a.avg !== null && a.maxValue !== null && a.count >= 5) {
      const pct = (a.avg / a.maxValue) * 100;
      const level = pct >= 70 ? 'elevated' : pct <= 35 ? 'low' : 'moderate';
      results.push({
        id: `assessment-${a.scaleName.toLowerCase().replace(/\s+/g, '-')}`,
        icon: '⭐',
        text: `Average ${a.scaleName} is ${a.avg}/${a.maxValue} (${level}) based on ${a.count} ratings this period.`,
      });
      break;
    }
  }

  return results.slice(0, 5);
}

interface ContextualPromptParams {
  hourOfDay: number;
  topCategory: string | null;
  hasReflectionToday: boolean;
  recentMeltdownCount: number;
}

/**
 * Generate 1-2 contextual prompts for the Home page based on time of day
 * and recent patterns.
 */
export function generateContextualPrompts(params: ContextualPromptParams): ContextualPrompt[] {
  const { hourOfDay, topCategory, hasReflectionToday, recentMeltdownCount } = params;
  const results: ContextualPrompt[] = [];

  // Time-of-day prompt
  if (hourOfDay >= 6 && hourOfDay < 10) {
    results.push({
      id: 'morning',
      text: 'Good morning — have you noted how last night went?',
    });
  } else if (hourOfDay >= 10 && hourOfDay < 14) {
    results.push({
      id: 'midday',
      text: 'Midday check-in — any transitions or mealtimes worth noting?',
    });
  } else if (hourOfDay >= 16 && hourOfDay < 20) {
    if (!hasReflectionToday) {
      results.push({
        id: 'evening-reflection',
        text: "End of the active day — how did things go overall? Tap Timeline to rate today.",
      });
    } else {
      results.push({
        id: 'evening',
        text: 'Evening wind-down — a good time to log any sensory or sleep notes.',
      });
    }
  } else if (hourOfDay >= 20 || hourOfDay < 6) {
    results.push({
      id: 'night',
      text: 'Winding down — log any sleep notes before tomorrow.',
    });
  }

  // Cross-cutting prompt
  if (recentMeltdownCount >= 2) {
    results.push({
      id: 'meltdown-followup',
      text: 'There have been a few difficult behavior events recently. Logging the context just before can help spot patterns over time.',
    });
  } else if (topCategory && !hasReflectionToday && hourOfDay >= 19) {
    results.push({
      id: 'reflection-nudge',
      text: `You've been logging ${topCategory} events. A quick daily reflection ties it all together.`,
    });
  }

  return results.slice(0, 2);
}
