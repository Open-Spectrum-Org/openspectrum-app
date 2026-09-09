import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from '../components/AppHeader';
import { useChild } from '../hooks/useChild';
import { useFocusAreas } from '../hooks/useFocusAreas';
import { getObservationsByDateRange } from '../db/queries/observations';
import { todayDateString, addDays, nowISO } from '../utils/date';
import {
  buildCSV,
  buildJSON,
  triggerDownload,
  filterByFocusAreas,
  buildFilename,
  type ExportMetadata,
} from '../utils/exportData';

type Preset = '7' | '30' | '90' | 'all' | 'custom';

const PRESETS: { value: Preset; label: string }[] = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

function parseCats(json: string | null): string[] {
  try { return json ? (JSON.parse(json) as string[]) : []; } catch { return []; }
}

export default function Settings() {
  const { child } = useChild();
  const { areas } = useFocusAreas();
  const today = todayDateString();

  const [preset, setPreset] = useState<Preset>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const startDate = useMemo(() => {
    if (preset === '7')   return addDays(today, -6);
    if (preset === '30')  return addDays(today, -29);
    if (preset === '90')  return addDays(today, -89);
    if (preset === 'all') return '2000-01-01';
    return customStart || today;
  }, [preset, customStart, today]);

  const endDate = useMemo(() => {
    if (preset !== 'custom') return today;
    return customEnd || today;
  }, [preset, customEnd, today]);

  const dateError =
    preset === 'custom' && customStart && customEnd && customEnd < customStart
      ? 'End date must be after start date'
      : null;

  const canExport = !exporting && !dateError && previewCount !== null && previewCount > 0 && !!child;

  useEffect(() => {
    if (!child) return;
    let cancelled = false;
    setPreviewLoading(true);
    getObservationsByDateRange(child.id, startDate, endDate).then((obs) => {
      if (cancelled) return;
      setPreviewCount(filterByFocusAreas(obs, areas, selectedAreaIds).length);
      setPreviewLoading(false);
    });
    return () => { cancelled = true; };
  }, [child?.id, startDate, endDate, selectedAreaIds, areas]);

  async function handleExport(format: 'csv' | 'json') {
    if (!child || !canExport) return;
    setExporting(true);
    setExportFeedback(null);
    try {
      const raw = await getObservationsByDateRange(child.id, startDate, endDate);
      const obs = filterByFocusAreas(raw, areas, selectedAreaIds);
      const selectedAreas = areas.filter((a) => selectedAreaIds.includes(a.id));
      const meta: ExportMetadata = {
        generatedAt: nowISO(),
        childName: child.display_name,
        dateRange: { start: startDate, end: endDate },
        focusAreas: selectedAreas.map((a) => ({
          id: a.id,
          title: a.title,
          categories: parseCats(a.related_categories),
        })),
        totalObservations: obs.length,
        dataLayerNote:
          'raw = directly logged; derived = system-inferred; ai_interpreted = AI transcription',
      };
      const content = format === 'csv' ? buildCSV(obs, meta) : buildJSON(obs, meta);
      const filename = buildFilename(child.display_name, startDate, endDate, format);
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      const result = await triggerDownload(content, filename, mimeType);
      if (result === 'clipboard') {
        setExportFeedback(
          'Content copied to clipboard — paste into a text file and save as .' + format
        );
      } else {
        setExportFeedback('Export ready.');
      }
    } catch {
      setExportFeedback('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function toggleArea(id: string) {
    setSelectedAreaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <AppHeader
        searchQuery=""
        onSearchChange={() => {}}
        placeholder=""
        showHome={true}
        editable={false}
      />

      <div className="flex-1 overflow-y-auto p-4 pb-12 space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Export Data</h2>

        {/* Date range */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-text-secondary">Date range</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  preset === p.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex gap-3 mt-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-text-muted">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={today}
                  className="w-full border border-border rounded-[8px] px-3 py-2 text-sm text-text-primary bg-white"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-text-muted">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  max={today}
                  className="w-full border border-border rounded-[8px] px-3 py-2 text-sm text-text-primary bg-white"
                />
              </div>
            </div>
          )}

          {dateError && (
            <p className="text-sm text-red-500">{dateError}</p>
          )}
        </div>

        {/* Scope / focus area filter */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-text-secondary">Scope</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedAreaIds([])}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedAreaIds.length === 0
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border'
              }`}
            >
              All observations
            </button>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => toggleArea(area.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedAreaIds.includes(area.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-border'
                }`}
              >
                {area.title}
              </button>
            ))}
          </div>
        </div>

        {/* Preview count */}
        <div className="bg-surface rounded-[10px] border border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-text-secondary">Observations in range</span>
          {previewLoading ? (
            <span className="text-sm text-text-muted">…</span>
          ) : (
            <span className="text-base font-semibold text-text-primary">
              {previewCount ?? '—'}
            </span>
          )}
        </div>

        {previewCount === 0 && !previewLoading && (
          <p className="text-sm text-text-muted text-center">No observations in this range.</p>
        )}

        {/* Export buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => { void handleExport('csv'); }}
            disabled={!canExport}
            className={`flex-1 py-3 rounded-[10px] text-sm font-semibold flex items-center justify-center bg-primary text-white transition-opacity ${
              canExport ? '' : 'opacity-40'
            }`}
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Export CSV'
            )}
          </button>
          <button
            onClick={() => { void handleExport('json'); }}
            disabled={!canExport}
            className={`flex-1 py-3 rounded-[10px] text-sm font-semibold border flex items-center justify-center transition-opacity ${
              canExport
                ? 'border-primary text-primary bg-white'
                : 'border-border text-text-muted bg-white opacity-40'
            }`}
          >
            {exporting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              'Export JSON'
            )}
          </button>
        </div>

        {exportFeedback && (
          <p
            className={`text-sm text-center ${
              exportFeedback.startsWith('Export failed') ? 'text-red-500' : 'text-green-600'
            }`}
          >
            {exportFeedback}
          </p>
        )}
      </div>
    </div>
  );
}
