import type { ObservationWithTags, FocusArea } from '../types/database';

export interface ExportMetadata {
  generatedAt: string;
  childName: string;
  dateRange: { start: string; end: string };
  focusAreas: { id: string; title: string; categories: string[] }[];
  totalObservations: number;
  dataLayerNote: string;
}

function csvEscape(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function buildCSV(obs: ObservationWithTags[], meta: ExportMetadata): string {
  const lines: string[] = [
    '# OpenSpectrum Export',
    `# Child: ${meta.childName}`,
    `# Date range: ${meta.dateRange.start} to ${meta.dateRange.end}`,
    `# Generated: ${meta.generatedAt}`,
    `# Data layers: ${meta.dataLayerNote}`,
    `# Total observations: ${meta.totalObservations}`,
    '',
    'id,occurred_at,event_time_precision,category,title,notes,tags,duration_minutes,severity,confidence,assessments,data_layer,entry_type',
  ];

  for (const ob of obs) {
    const tags = ob.tags.map((t) => t.name).join(' | ');
    const assessments = (ob.assessments ?? [])
      .map((a) => {
        if (a.scale.scale_type === 'numeric') {
          const max = a.scale.max_value !== null ? `/${a.scale.max_value}` : '';
          return `${a.scale.name}: ${a.numeric_value ?? ''}${max}`;
        }
        return `${a.scale.name}: ${a.categorical_value ?? ''}`;
      })
      .join('; ');

    const row = [
      csvEscape(ob.id),
      csvEscape(ob.occurred_at),
      csvEscape(ob.event_time_precision),
      csvEscape(ob.category),
      csvEscape(ob.title),
      csvEscape(ob.notes),
      csvEscape(tags),
      ob.duration_minutes !== null ? String(ob.duration_minutes) : '',
      ob.severity !== null ? String(ob.severity) : '',
      ob.confidence !== null ? String(ob.confidence) : '',
      csvEscape(assessments),
      csvEscape(ob.data_layer),
      csvEscape(ob.entry_type),
    ].join(',');

    lines.push(row);
  }

  return lines.join('\n');
}

export function buildJSON(obs: ObservationWithTags[], meta: ExportMetadata): string {
  const observations = obs.map((ob) => ({
    id: ob.id,
    occurred_at: ob.occurred_at,
    event_time_precision: ob.event_time_precision,
    category: ob.category,
    title: ob.title,
    notes: ob.notes,
    duration_minutes: ob.duration_minutes,
    severity: ob.severity,
    confidence: ob.confidence,
    data_layer: ob.data_layer,
    entry_type: ob.entry_type,
    tags: ob.tags.map((t) => t.name),
    assessments: (ob.assessments ?? []).map((a) => ({
      scale: a.scale.name,
      scale_type: a.scale.scale_type,
      value: a.scale.scale_type === 'numeric' ? a.numeric_value : a.categorical_value,
      ...(a.scale.scale_type === 'numeric' ? { max: a.scale.max_value } : {}),
    })),
  }));

  const envelope = {
    export_metadata: {
      generated_at: meta.generatedAt,
      child_name: meta.childName,
      date_range: meta.dateRange,
      focus_areas: meta.focusAreas,
      total_observations: meta.totalObservations,
      data_layer_note: meta.dataLayerNote,
    },
    observations,
  };

  return JSON.stringify(envelope, null, 2);
}

export async function triggerDownload(
  content: string,
  filename: string,
  mimeType: 'text/csv' | 'application/json'
): Promise<'download' | 'share' | 'clipboard'> {
  // Tier 1: Blob + <a download> — works on desktop and Android Chrome
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return 'download';
  } catch {
    // fall through to tier 2
  }

  // Tier 2: navigator.share — iOS PWA fallback
  try {
    const file = new File([content], filename, { type: mimeType });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return 'share';
    }
  } catch {
    // fall through to tier 3
  }

  // Tier 3: clipboard — last resort
  await navigator.clipboard.writeText(content);
  return 'clipboard';
}

export function filterByFocusAreas(
  obs: ObservationWithTags[],
  areas: FocusArea[],
  selectedIds: string[]
): ObservationWithTags[] {
  if (selectedIds.length === 0) return obs;

  const categorySet = new Set<string>();
  for (const area of areas) {
    if (!selectedIds.includes(area.id)) continue;
    try {
      const cats = area.related_categories ? (JSON.parse(area.related_categories) as string[]) : [];
      for (const c of cats) categorySet.add(c);
    } catch {
      // malformed JSON — skip this area
    }
  }

  return obs.filter((ob) => categorySet.has(ob.category));
}

export function buildFilename(
  childName: string,
  start: string,
  end: string,
  fmt: 'csv' | 'json'
): string {
  const safeName = childName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `OpenSpectrum_${safeName}_${start}_${end}.${fmt}`;
}
