'use client';
import { useEffect, useRef, useState } from 'react';
import { useDateRange, DATE_RANGE_LABELS, type DateRange } from '@/lib/date-range-context';
import { rangeStartDate, formatShortDate, formatYearDate } from '@/lib/date';

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export default function DateRangeToggle() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { range, setRange } = useDateRange();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const start = rangeStartDate(range);
  const end = new Date();
  const rangeLabel = start ? `${formatShortDate(start)} – ${formatShortDate(end)}` : 'All time';

  return (
    <div className="relative hidden lg:block" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400 bg-white border border-slate-200/80 rounded-xl px-3 h-9 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 transition-colors"
      >
        <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span className="hidden 2xl:inline text-slate-400 dark:text-zinc-500">{rangeLabel}</span>
        <span className="font-medium">{DATE_RANGE_LABELS[range]}</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
          <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500">
            {start ? `${formatYearDate(start)} – ${formatYearDate(end)}` : 'All time'}
          </p>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setRange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800 ${
                range === opt.value ? 'text-indigo-600 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-zinc-300'
              }`}
            >
              {opt.label}
              {range === opt.value && (
                <svg className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}