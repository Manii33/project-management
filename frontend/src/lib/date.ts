export function formatDateRange(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const locale = 'en-US';
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(locale, fmt)} – ${end.toLocaleDateString(locale, fmt)}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatShortDate(date: Date): string {
  const locale = 'en-US';
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString(locale, fmt);
}

export function formatYearDate(date: Date): string {
  const locale = 'en-US';
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(locale, fmt);
}

export function rangeStartDate(
  range: 'today' | '7d' | '30d' | 'all'
): Date | null {
  if (range === 'all') return null;
  const start = startOfToday();
  if (range === 'today') return start;
  const days = range === '7d' ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  return start;
}