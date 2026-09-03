'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Issue, IssueStatus, IssuePriority, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useRole } from '@/lib/hooks/useRole';
import { useDebounce } from '@/lib/hooks/useDebounce';

const STATUS_COLORS: Record<IssueStatus, string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  IN_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

const STATUS_ACCENTS: Record<IssueStatus, string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-indigo-500',
  IN_REVIEW: 'bg-amber-400',
  DONE: 'bg-emerald-500',
};

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW: 'text-slate-400 dark:text-zinc-500',
  MEDIUM: 'text-indigo-600 dark:text-indigo-300',
  HIGH: 'text-orange-600 dark:text-orange-300',
  URGENT: 'text-red-600 dark:text-red-400',
};

const PRIORITY_DOTS: Record<IssuePriority, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-indigo-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

const LABEL_COLORS: Record<IssuePriority, string> = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  MEDIUM: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

const LABEL_NAMES: Record<IssuePriority, string> = {
  LOW: 'Low priority',
  MEDIUM: 'Medium priority',
  HIGH: 'High priority',
  URGENT: 'Critical',
};

const STATUS_TABS: { key: '' | IssueStatus; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'TODO', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

const PRIORITY_TABS: { key: '' | IssuePriority; label: string }[] = [
  { key: '', label: 'All priorities' },
  { key: 'URGENT', label: 'Critical' },
  { key: 'HIGH', label: 'High' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} day${day !== 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

const tabClass =
  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer';

const activeTabClass = 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm';
const inactiveTabClass = 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200';

export default function AllIssuesPage() {
  const router = useRouter();
  const { isAdmin } = useRole();

  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(searchInput, 350);

  const { data, isLoading, error } = useQuery({
    queryKey: ['issues', 'all', filterStatus, filterPriority, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get<PaginatedResponse<Issue>>(`/issues?${params.toString()}`);
      return res.data;
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const hasActiveFilters = !!(searchInput || filterStatus || filterPriority);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">Issues</h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5">
                {data && <span>{data.total} issue{data.total !== 1 ? 's' : ''}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-56 hidden md:block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <input
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                  className="w-full bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow placeholder-slate-400 dark:placeholder-zinc-500"
                  placeholder="Search issues..."
                />
              </div>
              {isAdmin && (
                <button
                  onClick={() => router.push('/projects')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-500/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New Issue
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-zinc-800 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setFilterStatus(t.key); setPage(1); }}
                  className={`${tabClass} ${filterStatus === t.key ? activeTabClass : inactiveTabClass}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-zinc-800 rounded-xl border border-slate-200/60 dark:border-zinc-800">
              {PRIORITY_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setFilterPriority(t.key); setPage(1); }}
                  className={`${tabClass} ${filterPriority === t.key ? activeTabClass : inactiveTabClass}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => { setSearchInput(''); setFilterStatus(''); setFilterPriority(''); setPage(1); }}
                className="px-3.5 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 transition-colors font-medium"
              >
                ✕ Clear filters
              </button>
            </div>
          )}

          {/* States */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load issues" />}
          {!isLoading && !error && data?.data.length === 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-sm">
              <div className="text-4xl mb-3 text-slate-300">🗂️</div>
              <p className="text-slate-500 dark:text-zinc-300 font-medium">{hasActiveFilters ? 'No issues match your filters' : 'No issues yet'}</p>
              <p className="text-slate-400 dark:text-zinc-500 text-sm mt-1">
                {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Issues you can access will appear here.'}
              </p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !error && data && data.data.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden">
              {/* Header row */}
              <div className="hidden lg:grid grid-cols-[minmax(280px,2.2fr)_1fr_1fr_1fr_1fr_0.9fr_0.9fr] items-center gap-4 px-6 py-3 bg-slate-50 dark:bg-zinc-800/50 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-500 border-b border-slate-200/80 dark:border-zinc-800">
                <span>Title</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Project</span>
                <span>Assignee</span>
                <span>Updated</span>
                <span>Label</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {data.data.map((issue) => {
                  const done = issue.status === 'DONE';
                  const idCode = `#${issue.id.slice(0, 6).toUpperCase()}`;
                  return (
                    <div
                      key={issue.id}
                      onClick={() => router.push(`/projects/${issue.project.id}/issues`)}
                      className="grid grid-cols-1 lg:grid-cols-[minmax(280px,2.2fr)_1fr_1fr_1fr_1fr_0.9fr_0.9fr] items-center gap-4 px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      {/* Title + ID */}
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold text-slate-800 dark:text-zinc-100 ${done ? 'line-through text-slate-400 dark:text-zinc-500' : ''} truncate`}>
                          {issue.title}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{idCode}</p>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[issue.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_ACCENTS[issue.status]}`} />
                          {issue.status}
                        </span>
                      </div>

                      {/* Priority */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[issue.priority]}`} />
                          {issue.priority}
                        </span>
                      </div>

                      {/* Project */}
                      <div>
                        <span className="text-sm text-slate-600 dark:text-zinc-300 truncate block max-w-[140px]">{issue.project?.name}</span>
                      </div>

                      {/* Assignee */}
                      <div>
                        {issue.assignee ? (
                          <span className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {issue.assignee.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-zinc-300 truncate">{issue.assignee.name}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-zinc-500">Unassigned</span>
                        )}
                      </div>

                      {/* Updated */}
                      <div>
                        <span className="text-sm text-slate-500 dark:text-zinc-400">{timeAgo(issue.updatedAt)}</span>
                      </div>

                      {/* Label */}
                      <div>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${LABEL_COLORS[issue.priority]}`}>
                          {LABEL_NAMES[issue.priority]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800">
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-3 py-2 text-sm text-slate-600 dark:text-zinc-300 font-medium">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}