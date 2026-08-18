export function todayDateString(): string {
  return new Date().toISOString().split('T')[0]!;
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
  if (dateString === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateString === yesterday.toISOString().split('T')[0]) return 'Yesterday';

  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]!;
}

export function isToday(dateString: string): boolean {
  return dateString === todayDateString();
}
