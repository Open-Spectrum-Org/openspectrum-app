// Dates are YYYY-MM-DD in the user's local timezone.
export function localDateString(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayDateString(): string {
  return localDateString();
}

export function isoToLocalDate(iso: string): string {
  // Legacy date-only values are already a local date.
  return iso.length === 10 ? iso : localDateString(new Date(iso));
}

// ISO bounds of a local calendar day, for occurred_at range queries.
export function dayStartISO(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

export function dayEndISO(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDateDisplay(dateString: string): string {
  const today = todayDateString();
  const date = new Date(dateString + 'T00:00:00');
  const shortDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  if (dateString === today) return `Today (${shortDate})`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateString === localDateString(yesterday)) return `Yesterday (${shortDate})`;

  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

export function isToday(dateString: string): boolean {
  return dateString === todayDateString();
}
