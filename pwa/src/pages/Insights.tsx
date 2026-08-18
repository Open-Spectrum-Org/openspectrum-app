import { useMemo, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { useInsightsData } from '../hooks/useInsightsData';
import { colors, categoryColor, categoryColorLight } from '../theme';
import { todayDateString, addDays } from '../utils/date';

type RangeOption = '7' | '14' | '30';

const RANGE_LABELS: Record<RangeOption, string> = {
  '7': '7 Days',
  '14': '14 Days',
  '30': '30 Days',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  behavior: '⚡', emotion: '😊', food: '🍽️', medication: '💊',
  sleep: '😴', sensory: '🔮', transitions: '🔄', successes: '🌟',
  trigger: '⚠️', other: '📝',
};

const RATING_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  better_than_usual: { label: 'Better days', emoji: '😊', color: colors.betterThanUsual },
  typical: { label: 'Typical days', emoji: '😐', color: colors.typical },
  difficult: { label: 'Difficult days', emoji: '😟', color: colors.difficult },
};

function hourLabel(h: number): string {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

export default function Insights() {
  const [range, setRange] = useState<RangeOption>('7');
  const today = todayDateString();
  const startDate = addDays(today, -parseInt(range) + 1);
  const { data, loading } = useInsightsData(startDate, today);

  const peakHour = useMemo(() => {
    if (!data?.hourlyDistribution.length) return null;
    return data.hourlyDistribution.reduce((best, cur) => (cur.count > best.count ? cur : best));
  }, [data]);

  const trend = useMemo(() => {
    if (!data?.dailyCounts || data.dailyCounts.length < 2) return null;
    const counts = data.dailyCounts;
    const mid = Math.floor(counts.length / 2);
    const firstHalf = counts.slice(0, mid);
    const secondHalf = counts.slice(mid);
    const avg = (arr: typeof counts) => arr.reduce((s, d) => s + d.count, 0) / (arr.length || 1);
    const first = avg(firstHalf);
    const second = avg(secondHalf);
    const diff = second - first;
    const pct = first > 0 ? Math.round((Math.abs(diff) / first) * 100) : 0;
    if (Math.abs(diff) < 0.5) return { direction: 'stable' as const, pct: 0 };
    return { direction: diff > 0 ? ('up' as const) : ('down' as const), pct };
  }, [data]);

  const avgPerDay = useMemo(() => {
    if (!data) return 0;
    const days = parseInt(range);
    return Math.round((data.totalCount / days) * 10) / 10;
  }, [data, range]);

  const maxHourly = useMemo(() => {
    if (!data?.hourlyDistribution.length) return 0;
    return Math.max(...data.hourlyDistribution.map((h) => h.count));
  }, [data]);

  return (
    <div className="flex flex-col h-full bg-white">
      <AppHeader searchQuery="" onSearchChange={() => {}} placeholder="Search coming soon" showHome={true} editable={false} />
      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-4">
        {/* Range selector */}
        <div className="flex gap-2">
          {(Object.keys(RANGE_LABELS) as RangeOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setRange(opt)}
              className={`flex-1 py-2 rounded-[10px] text-center border text-sm font-semibold ${
                range === opt
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface border-border text-text-secondary'
              }`}
            >
              {RANGE_LABELS[opt]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center pt-24">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data || data.totalCount === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-2">
            <span className="text-5xl">🔍</span>
            <span className="text-lg font-semibold text-text-primary">Not enough data yet</span>
            <span className="text-base text-text-secondary">Keep logging to discover patterns</span>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="flex gap-2">
              {[
                { value: data.totalCount, label: 'Total Logs' },
                { value: avgPerDay, label: 'Per Day' },
                { value: data.categoryBreakdown.length, label: 'Categories' },
              ].map((card) => (
                <div key={card.label} className="flex-1 bg-surface rounded-[10px] p-3 text-center border border-border">
                  <div className="text-[22px] font-semibold text-primary">{card.value}</div>
                  <div className="text-xs text-text-secondary">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Trend insight */}
            {trend && (
              <div className="flex bg-surface rounded-[10px] p-4 border border-border gap-3">
                <span className="text-[28px]">
                  {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-primary mb-1">Activity Trend</div>
                  <div className="text-sm text-text-secondary leading-5">
                    {trend.direction === 'stable'
                      ? 'Observation rate has been steady this period.'
                      : `Observations are ${trend.direction} ~${trend.pct}% compared to the first half of this period.`}
                  </div>
                </div>
              </div>
            )}

            {/* Peak hour */}
            {peakHour && (
              <div className="flex bg-surface rounded-[10px] p-4 border border-border gap-3">
                <span className="text-[28px]">🕐</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-primary mb-1">Busiest Time</div>
                  <div className="text-sm text-text-secondary leading-5">
                    Most observations logged around {hourLabel(peakHour.hour)} ({peakHour.count} entries).
                  </div>
                </div>
              </div>
            )}

            {/* Top category */}
            {data.categoryBreakdown.length > 0 && (
              <div className="flex bg-surface rounded-[10px] p-4 border border-border gap-3">
                <span className="text-[28px]">
                  {CATEGORY_EMOJIS[data.categoryBreakdown[0]!.category] ?? '📝'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-primary mb-1">Most Tracked</div>
                  <div className="text-sm text-text-secondary leading-5">
                    <span className="font-semibold capitalize">{data.categoryBreakdown[0]!.category}</span>{' '}
                    is the most logged category with {data.categoryBreakdown[0]!.count} observations (
                    {Math.round((data.categoryBreakdown[0]!.count / data.totalCount) * 100)}%).
                  </div>
                </div>
              </div>
            )}

            {/* Reflection correlation */}
            {data.reflectionCorrelation.length > 0 && (
              <div className="flex bg-surface rounded-[10px] p-4 border border-border gap-3">
                <span className="text-[28px]">💡</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text-primary mb-1">Reflection Patterns</div>
                  {data.reflectionCorrelation.map((rc) => {
                    const info = RATING_INFO[rc.rating];
                    return (
                      <div key={rc.rating} className="text-sm text-text-secondary leading-5">
                        {info?.emoji ?? '❓'} {info?.label ?? rc.rating}: avg{' '}
                        <span className="font-semibold">{rc.avgObservations}</span> observations/day
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hourly distribution */}
            {data.hourlyDistribution.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Time of Day</h3>
                <div className="flex items-end h-[90px] gap-px">
                  {data.hourlyDistribution.map((h) => (
                    <div key={h.hour} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-4/5 rounded-sm"
                        style={{
                          height: maxHourly > 0 ? Math.max((h.count / maxHourly) * 60, 2) : 2,
                          backgroundColor: peakHour && h.hour === peakHour.hour ? colors.primary : colors.primaryLight,
                        }}
                      />
                      <span className="text-[9px] text-text-muted mt-0.5 h-3">
                        {h.hour % 3 === 0 ? hourLabel(h.hour) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top tags */}
            {data.topTags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Most Used Tags</h3>
                {data.topTags.map((tag, i) => (
                  <div key={tag.name} className="flex items-center py-2 gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: categoryColorLight(tag.category, 0.15) }}
                    >
                      <span className="text-sm font-semibold" style={{ color: categoryColor(tag.category) }}>
                        {i + 1}
                      </span>
                    </div>
                    <span className="flex-1 text-base text-text-primary">{tag.name}</span>
                    <span className="text-sm font-semibold" style={{ color: categoryColor(tag.category) }}>
                      {tag.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
