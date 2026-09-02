'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Issue, IssueStatus, IssuePriority, User, PaginatedResponse } from '@/lib/types';
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

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300',
  MEDIUM: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
};

const PRIORITY_DOTS: Record<IssuePriority, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-indigo-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

const STATUSES: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const selectClass =
  'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow';

export default function AllIssuesPage() {
  const router = useRouter();
  const { isAdmin } = useRole();

  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(searchInput, 350);

  const { data, isLoading, error } = useQuery({
    queryKey: ['issues', 'all', filterStatus, filterPriority, filterAssignee, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterAssignee) params.append('assigneeId', filterAssignee);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get<PaginatedResponse<Issue>>(`/issues?${params.toString()}`);
      return res.data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<User[]>('/users');
      return res.data;
    },
    enabled: isAdmin,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const hasActiveFilters = !!(searchInput || filterStatus || filterPriority || filterAssignee);

  const [relativeNow] = useState(() => Date.now());

  const isOverdue = (dueDate: string | null) =>
    !!dueDate && new Date(dueDate).getTime() < relativeNow;

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">All Issues</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {data && <span>{data.total} issue{data.total !== 1 ? 's' : ''} across your projects</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isLoading && data && data.total > 0 && (
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 text-xs font-medium">
                  Page {page} of {totalPages || 1}
                </span>
              )}
              {isAdmin && (
                <button
                  onClick={() => router.push('/projects')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-md shadow-indigo-500/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New Issue
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className="w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 shadow-sm transition-shadow placeholder-slate-400 dark:placeholder-slate-500"
              placeholder="Search by title, description, or assignee..."
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap items-center">
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as IssueStatus | ''); setPage(1); }} className={selectClass}>
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value as IssuePriority | ''); setPage(1); }} className={selectClass}>
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterAssignee} onChange={(e) => { setFilterAssignee(e.target.value); setPage(1); }} className={selectClass}>
              <option value="">All Assignees</option>
              {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setFilterStatus('');
                  setFilterPriority('');
                  setFilterAssignee('');
                  setPage(1);
                }}
                className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10 transition-colors font-medium"
              >
                ✕ Reset Filters
              </button>
            )}
          </div>

          {/* States: loading / error / empty */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load issues" />}
          {!isLoading && !error && data?.data.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
              <div className="text-4xl mb-3 text-slate-300">🗂️</div>
              <p className="text-slate-500 dark:text-slate-300 font-medium">{hasActiveFilters ? 'No issues match your filters' : 'No issues yet'}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Issues you can access will appear here.'}
              </p>
            </div>
          )}

          {/* Issue List */}
          <div className="space-y-3">
            {data?.data.map((issue: Issue) => {
              const done = issue.status === 'DONE';
              const overdue = isOverdue(issue.dueDate);
              return (
                <div
                  key={issue.id}
                  onClick={() => router.push(`/projects/${issue.project.id}/issues`)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Top row: project + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 text-xs font-semibold">
                          {issue.project?.name}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[issue.status]}`}>
                          {done ? '✓ ' : ''}{issue.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[issue.priority]}`}>
                          {issue.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mt-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                        {issue.title}
                      </h3>

                      {/* Description */}
                      {issue.description && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-1">{issue.description}</p>
                      )}

                      {/* Footer meta */}
                      <div className="flex items-center gap-5 mt-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {issue.assignee ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                              {issue.assignee.name.charAt(0).toUpperCase()}
                            </span>
                            {issue.assignee.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
                        )}
                        {issue.dueDate && (
                          <span className={`flex items-center gap-1 ${overdue && !done ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                            {overdue && !done ? '⚠️' : '📅'}
                            Due {new Date(issue.dueDate).toLocaleDateString()}
                            {overdue && !done && ' · Overdue'}
                          </span>
                        )}
                        <span>Created by {issue.creator?.name}</span>
                      </div>
                    </div>

                    {/* Right: priority dot + arrow */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOTS[issue.priority]}`} />
                      <span className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 text-lg transition-colors">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  ← Previous
                </button>
                <span className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 font-medium">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
