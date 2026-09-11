'use client';
import { useEffect, useRef, useState } from 'react';
import { useExportData } from '@/lib/export-context';
import { exportData } from '@/lib/export';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

interface Options {
  label: string;
  format: 'csv' | 'xlsx' | 'pdf';
  hint: string;
}

const OPTIONS: Options[] = [
  { label: 'Export as CSV', format: 'csv', hint: 'Comma-separated values' },
  { label: 'Export as Excel', format: 'xlsx', hint: 'Microsoft Excel workbook' },
  { label: 'Export as PDF Report', format: 'pdf', hint: 'Printable PDF document' },
];

export default function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data } = useExportData();

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

  const runExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!data) {
      showErrorToast('No data available to export yet');
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(false);
    setTimeout(() => {
      try {
        exportData(format, data);
        showSuccessToast('Export completed successfully');
      } catch {
        showErrorToast('Export failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-300 bg-white border border-slate-200/80 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl px-3 h-9 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900 disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-zinc-600 dark:border-t-zinc-300" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>Export</span>
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50">
          {OPTIONS.map((opt) => (
            <button
              key={opt.format}
              onClick={() => runExport(opt.format)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800"
            >
              <span className="text-slate-400 dark:text-zinc-500">
                <DownloadIcon format={opt.format} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-700 dark:text-zinc-100">{opt.label}</span>
                <span className="block text-[11px] text-slate-400 dark:text-zinc-500">{opt.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadIcon({ format }: { format: 'csv' | 'xlsx' | 'pdf' }) {
  const common = { className: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 };
  if (format === 'pdf') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  if (format === 'xlsx') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}