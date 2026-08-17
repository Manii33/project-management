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

const inputClass = 'w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400';

const STATUS_COLORS: Record<IssueStatus, string> = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

const STATUSES: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AllIssuesPage() {
  const router = useRouter();
  const { isAdmin } = useRole();

  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['issues', 'all', filterStatus, filterPriority, filterAssignee, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterAssignee) params.append('assigneeId', filterAssignee);
      if (search) params.append('search', search);
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

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">All Issues</h1>
          </div>

          <div className="mb-4">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={inputClass}
              placeholder="🔍 Search issues..."
            />
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as IssueStatus | ''); setPage(1); }} className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value as IssuePriority | ''); setPage(1); }} className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterAssignee} onChange={(e) => { setFilterAssignee(e.target.value); setPage(1); }} className="bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Assignees</option>
              {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load issues" />}
          {!isLoading && data?.data.length === 0 && (
            <div className="bg-white border rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">No issues found</p>
            </div>
          )}

          <div className="space-y-3">
            {data?.data.map((issue: Issue) => (
              <div
                key={issue.id}
                onClick={() => router.push(`/projects/${issue.project.id}/issues`)}
                className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">{issue.project?.name}</span>
                      <h3 className="font-semibold text-gray-800">{issue.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>{issue.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
                    </div>
                    {issue.description && <p className="text-gray-500 text-sm mt-1 line-clamp-1">{issue.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>Assignee: {issue.assignee?.name || 'Unassigned'}</span>
                      {issue.dueDate && <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>}
                      <span>By: {issue.creator?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data && data.total > limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
                <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}