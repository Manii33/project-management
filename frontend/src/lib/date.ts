export function formatDateRange(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const locale = 'en-US';
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(locale, fmt)} – ${end.toLocaleDateString(locale, fmt)}`;
}