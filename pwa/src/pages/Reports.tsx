import { useMemo, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { useChild } from '../hooks/useChild';
import { useFocusAreas } from '../hooks/useFocusAreas';
import { useReportData } from '../hooks/useReportData';
import { colors, categoryColor, categoryColorLight } from '../theme';
import { todayDateString, addDays, nowISO } from '../utils/date';
import { generateHypotheses } from '../utils/insights';
import { getObservationsByDateRange } from '../db/queries/observations';
import { buildCSV, buildJSON, buildFilename, triggerDownload, type ExportMetadata } from '../utils/exportData';

type RangeOption = '7' | '14' | '30';

const RANGE_LABELS: Record<RangeOption, string> = {
  '7': '7 Days',
  '14': '14 Days',
  '30': '30 Days',
};

const RATING_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  better_than_usual: { label: 'Better', emoji: '😊', color: colors.betterThanUsual },
  typical: { label: 'Typical', emoji: '😐', color: colors.typical },
  difficult: { label: 'Difficult', emoji: '😟', color: colors.difficult },
};

const CATEGORY_EMOJIS: Record<string, string> = {
  behavior: '⚡', emotion: '😊', food: '🍽️', medication: '💊',
  sleep: '😴', sensory: '🔮', transitions: '🔄', successes: '🌟',
  trigger: '⚠️', other: '📝',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hourLabel(h: number): string {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

function parseCats(json: string | null): string[] {
  try { return json ? (JSON.parse(json) as string[]) : []; } catch { return []; }
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString([], opts)} – ${e.toLocaleDateString([], opts)}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-text-primary pt-4 border-t border-border">{children}</h2>;
}

export default function Reports() {
  const { child } = useChild();
  const { areas } = useFocusAreas();
  const [range, setRange] = useState<RangeOption>('7');
  const [focusAreaId, setFocusAreaId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const today = todayDateString();
  const periodDays = parseInt(range);
  const startDate = addDays(today, -periodDays + 1);

  const activeFocusAreas = useMemo(() => areas.filter((a) => a.status === 'active'), [areas]);
  const selectedFocusArea = areas.find((a) => a.id === focusAreaId) ?? null;
  const categories = useMemo(() => {
    const cats = selectedFocusArea ? parseCats(selectedFocusArea.related_categories) : [];
    return cats.length ? cats : undefined;
  }, [selectedFocusArea?.id, selectedFocusArea?.related_categories]);

  const { data, loading } = useReportData(startDate, today, periodDays, categories);

  const maxCategory = useMemo(() => {
    if (!data?.categoryBreakdown.length) return 0;
    return Math.max(...data.categoryBreakdown.map((c) => c.count));
  }, [data]);

  const maxDaily = useMemo(() => {
    if (!data?.dailyCounts.length) return 0;
    return Math.max(...data.dailyCounts.map((d) => d.count));
  }, [data]);

  const maxHourly = useMemo(() => {
    if (!data?.hourlyDistribution.length) return 0;
    return Math.max(...data.hourlyDistribution.map((h) => h.count));
  }, [data]);

  const maxDayOfWeek = useMemo(() => {
    if (!data?.dayOfWeekPattern.length) return 0;
    return Math.max(...data.dayOfWeekPattern.map((d) => d.count));
  }, [data]);

  const peakHour = useMemo(() => {
    if (!data?.hourlyDistribution.length) return null;
    return data.hourlyDistribution.reduce((best, cur) => (cur.count > best.count ? cur : best));
  }, [data]);

  // % change vs the previous period of the same length (hidden when there's no prior data)
  const periodChangePct = useMemo(() => {
    if (!data) return null;
    const priorTotal = data.priorCategoryBreakdown.reduce((s, c) => s + c.count, 0);
    if (priorTotal === 0) return null;
    return Math.round(((data.totalCount - priorTotal) / priorTotal) * 100);
  }, [data]);

  const hypotheses = useMemo(() => (data ? generateHypotheses(data) : []), [data]);

  const shareReport = async () => {
    if (!data || !child) return;
    const lines = [
      `OpenSpectrum Report — ${child.display_name}`,
      `Period: ${formatDateRange(startDate, today)}`,
      ...(selectedFocusArea ? [`Focus area: ${selectedFocusArea.title}`] : []),
      `Total Observations: ${data.totalCount}`,
      '',
      '--- Insights ---',
      ...hypotheses.map((h) => `${h.icon} ${h.text}`),
      '',
      '--- Category Breakdown ---',
      ...data.categoryBreakdown.map(
        (c) => `${CATEGORY_EMOJIS[c.category] ?? '📝'} ${c.category}: ${c.count}`
      ),
      '',
      '--- Top Tags ---',
      ...data.topTags.map((t, i) => `${i + 1}. ${t.name} (${t.count})`),
      '',
      '--- Daily Reflections ---',
      ...data.reflections.map(
        (r) => `${RATING_LABELS[r.rating]?.emoji ?? '❓'} ${RATING_LABELS[r.rating]?.label ?? r.rating}: ${r.count} days`
      ),
      '',
      'Generated by OpenSpectrum',
    ];

    if (navigator.share) {
      await navigator.share({ text: lines.join('\n') });
    } else {
      await navigator.clipboard.writeText(lines.join('\n'));
      alert('Report copied to clipboard');
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    if (!child) return;
    setExportMenuOpen(false);
    setExportFeedback(null);
    try {
      const all = await getObservationsByDateRange(child.id, startDate, today);
      const obs = categories ? all.filter((o) => categories.includes(o.category)) : all;
      const meta: ExportMetadata = {
        generatedAt: nowISO(),
        childName: child.display_name,
        dateRange: { start: startDate, end: today },
        focusAreas: selectedFocusArea
          ? [{ id: selectedFocusArea.id, title: selectedFocusArea.title, categories: categories ?? [] }]
          : [],
        totalObservations: obs.length,
        dataLayerNote:
          'raw = directly logged; derived = system-inferred; ai_interpreted = AI transcription',
      };
      const content = format === 'csv' ? buildCSV(obs, meta) : buildJSON(obs, meta);
      const filename = buildFilename(child.display_name, startDate, today, format);
      const result = await triggerDownload(content, filename, format === 'csv' ? 'text/csv' : 'application/json');
      if (result === 'clipboard') {
        setExportFeedback(`Copied to clipboard — paste into a text file and save as .${format}`);
      }
    } catch {
      setExportFeedback('Export failed. Please try again.');
    }
  };

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
      active ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary bg-surface'
    }`;

  return (
    <div className="flex flex-col h-full bg-white">
      <AppHeader searchQuery="" onSearchChange={() => {}} showHome={true} editable={false} />
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

        {/* Focus area filter */}
        {activeFocusAreas.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFocusAreaId(null)} className={chipClass(focusAreaId === null)}>
              All data
            </button>
            {activeFocusAreas.map((area) => (
              <button key={area.id} onClick={() => setFocusAreaId(area.id)} className={chipClass(focusAreaId === area.id)}>
                🎯 {area.title}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-text-muted text-center">{formatDateRange(startDate, today)}</p>

        {loading ? (
          <div className="flex justify-center pt-24">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data || data.totalCount === 0 ? (
          <div className="flex flex-col items-center pt-20 gap-2">
            <span className="text-5xl">📭</span>
            <span className="text-lg font-semibold text-text-primary">No observations in this period</span>
            <span className="text-base text-text-secondary">Start logging to see your report</span>
          </div>
        ) : (
          <>
            {/* ── Summary ─────────────────────────────────────────── */}
            <div className="bg-primary-light rounded-2xl p-6 text-center">
              <div className="text-[40px] font-bold text-primary">{data.totalCount}</div>
              <div className="text-base text-primary">Total Observations</div>
              {periodChangePct !== null && (
                <div className="text-xs text-text-secondary mt-1">
                  {periodChangePct >= 0 ? '▲' : '▼'} {Math.abs(periodChangePct)}% vs previous {periodDays} days
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">By Category</h3>
              {data.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center mb-2 gap-2">
                  <span className="text-sm text-text-primary w-[110px] capitalize">
                    {CATEGORY_EMOJIS[cat.category] ?? '📝'} {cat.category}
                  </span>
                  <div className="flex-1 h-4 bg-surface-alt rounded overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(cat.count / maxCategory) * 100}%`,
                        backgroundColor: categoryColor(cat.category),
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-[30px] text-right" style={{ color: categoryColor(cat.category) }}>
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-3">Daily Activity</h3>
              <div className="flex items-end gap-0.5 h-[120px] pt-5">
                {data.dailyCounts.map((day, i) => {
                  const showLabels = data.dailyCounts.length <= 14;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                      {showLabels && <span className="text-xs text-text-muted mb-0.5">{day.count}</span>}
                      <div
                        className="w-[70%] rounded-sm bg-primary"
                        style={{ height: maxDaily > 0 ? Math.max((day.count / maxDaily) * 80, 4) : 4 }}
                      />
                      <span className="text-[10px] text-text-muted mt-0.5 h-3">
                        {showLabels || i % 5 === 0 ? formatDateShort(day.date).split(' ')[1] : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {data.topTags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Top Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {data.topTags.map((tag) => (
                    <div
                      key={tag.name}
                      className="flex items-center gap-1 py-1 px-3 rounded-full"
                      style={{ backgroundColor: categoryColorLight(tag.category, 0.15) }}
                    >
                      <span className="text-sm font-semibold" style={{ color: categoryColor(tag.category) }}>
                        {tag.name}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-px text-xs font-bold text-white min-w-[20px] text-center"
                        style={{ backgroundColor: categoryColor(tag.category) }}
                      >
                        {tag.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.reflections.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Daily Reflections</h3>
                <div className="flex gap-2">
                  {data.reflections.map((r) => {
                    const info = RATING_LABELS[r.rating];
                    return (
                      <div
                        key={r.rating}
                        className="flex-1 flex flex-col items-center p-3 rounded-[10px] bg-surface border"
                        style={{ borderColor: info?.color ?? colors.border }}
                      >
                        <span className="text-2xl">{info?.emoji ?? '❓'}</span>
                        <span className="text-[22px] font-semibold mt-1" style={{ color: info?.color ?? colors.text }}>
                          {r.count}
                        </span>
                        <span className="text-xs text-text-secondary">{info?.label ?? r.rating}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Insights ────────────────────────────────────────── */}
            {(hypotheses.length > 0 || data.assessmentAverages.length > 0) && (
              <>
                <SectionTitle>Insights</SectionTitle>
                {hypotheses.length > 0 && (
                  <div className="space-y-3">
                    {hypotheses.map((h) => (
                      <div key={h.id} className="flex bg-surface rounded-[10px] p-4 border border-border gap-3">
                        <span className="text-[24px] leading-none mt-0.5">{h.icon}</span>
                        <p className="flex-1 text-sm text-text-secondary leading-5">{h.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {data.assessmentAverages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Assessment Scores</h3>
                    <div className="space-y-2">
                      {data.assessmentAverages.map((a) => (
                        <div key={a.scaleId} className="bg-surface rounded-[10px] p-4 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-text-primary">{a.scaleName}</span>
                            <span className="text-xs text-text-muted">{a.count} ratings</span>
                          </div>
                          {a.scaleType === 'numeric' && a.avg !== null && a.maxValue !== null ? (
                            <>
                              <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-[22px] font-semibold text-primary">{a.avg}</span>
                                <span className="text-sm text-text-muted">/ {a.maxValue}</span>
                              </div>
                              <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${(a.avg / a.maxValue) * 100}%`, backgroundColor: colors.primary }}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(a.distribution)
                                .sort((x, y) => y[1] - x[1])
                                .map(([val, cnt]) => (
                                  <span
                                    key={val}
                                    className="px-2 py-0.5 bg-white border border-border rounded-full text-xs text-text-secondary"
                                  >
                                    {val.replace('_', ' ')}: {cnt}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Patterns ────────────────────────────────────────── */}
            <SectionTitle>Patterns</SectionTitle>

            {data.hourlyDistribution.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">Time of Day</h3>
                {peakHour && (
                  <p className="text-sm text-text-secondary mb-3">
                    Busiest around {hourLabel(peakHour.hour)} ({peakHour.count} entries)
                  </p>
                )}
                <div className="flex items-end h-[90px] gap-px">
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => {
                    const count = data.hourlyDistribution.find((h) => h.hour === hour)?.count ?? 0;
                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center justify-end">
                        <div
                          className="w-4/5 rounded-sm"
                          style={{
                            height: maxHourly > 0 ? Math.max((count / maxHourly) * 60, count > 0 ? 2 : 0) : 0,
                            backgroundColor: peakHour && hour === peakHour.hour ? colors.primary : colors.primaryLight,
                          }}
                        />
                        <span className="text-[9px] text-text-muted mt-0.5 h-3">
                          {hour % 3 === 0 ? hourLabel(hour) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.dayOfWeekPattern.some((d) => d.count > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Day of Week</h3>
                <div className="flex items-end h-[80px] gap-1">
                  {data.dayOfWeekPattern.map((d) => (
                    <div key={d.dayIndex} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: maxDayOfWeek > 0 ? Math.max((d.count / maxDayOfWeek) * 52, d.count > 0 ? 2 : 0) : 0,
                          backgroundColor: colors.primaryLight,
                        }}
                      />
                      <span className="text-[9px] text-text-muted mt-1">{DAY_LABELS[d.dayIndex]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share + Export */}
            <div className="relative flex gap-3 pt-2">
              <button
                onClick={shareReport}
                className="flex-1 bg-primary rounded-[10px] py-3 text-center"
              >
                <span className="text-base font-semibold text-white">Share Report</span>
              </button>
              <button
                onClick={() => setExportMenuOpen((o) => !o)}
                className="flex-1 border border-primary bg-white rounded-[10px] py-3 text-center"
              >
                <span className="text-base font-semibold text-primary">Export Data ▾</span>
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-[calc(50%-6px)] bg-white border border-border rounded-[10px] shadow-lg overflow-hidden">
                  <button
                    onClick={() => { void exportData('csv'); }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-text-primary active:bg-surface"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => { void exportData('json'); }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-text-primary border-t border-border active:bg-surface"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>
            {exportFeedback && (
              <p className={`text-sm text-center ${exportFeedback.startsWith('Export failed') ? 'text-red-500' : 'text-text-muted'}`}>
                {exportFeedback}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
