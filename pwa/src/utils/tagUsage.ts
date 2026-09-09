const STORAGE_KEY = 'openspectrum_tag_usage';

export function getUsageCounts(childId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, Record<string, number>>;
    return all[childId] ?? {};
  } catch {
    return {};
  }
}

export function recordTagUse(childId: string, tagId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, Record<string, number>> = raw ? JSON.parse(raw) : {};
    const counts = all[childId] ?? {};
    counts[tagId] = (counts[tagId] ?? 0) + 1;
    all[childId] = counts;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}
