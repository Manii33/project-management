'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { getErrorMessage } from '@/lib/api';
import { Issue, IssueStatus, IssuePriority, ProjectMember, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Comments from '@/components/Comments';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/lib/hooks/useDebounce';

const inputClass = 'w-full bg-white text-gray-900 dark:bg-slate-800 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-slate-500';

const STATUS_COLORS: Record<IssueStatus, string> = {
  TODO: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
};

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW: 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  URGENT: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
};

const STATUSES: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function IssuesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IssueStatus>('TODO');
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [formError, setFormError] = useState('');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<IssueStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<IssuePriority | ''>('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const debouncedSearch = useDebounce(searchInput, 350);

  // Fetch issues
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['issues', projectId, filterStatus, filterPriority, filterAssignee, debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterAssignee) params.append('assigneeId', filterAssignee);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get<PaginatedResponse<Issue>>(`/projects/${projectId}/issues?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch members for assignee dropdown
  const { data: members, error: membersError } = useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const res = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: object) => api.post(`/projects/${projectId}/issues`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      resetForm();
    },
    onError: () => setFormError('Failed to create issue'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: object }) =>
      api.put(`/projects/${projectId}/issues/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      resetForm();
      setSelectedIssue(null);
    },
    onError: () => setFormError('Failed to update issue'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${projectId}/issues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      setConfirmDelete(null);
      setSelectedIssue(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditIssue(null);
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setPriority('MEDIUM');
    setDueDate('');
    setAssigneeId('');
    setFormError('');
  };

  const handleEdit = (issue: Issue) => {
    setEditIssue(issue);
    setTitle(issue.title);
    setDescription(issue.description || '');
    setStatus(issue.status);
    setPriority(issue.priority);
    setDueDate(issue.dueDate ? issue.dueDate.split('T')[0] : '');
    setAssigneeId(issue.assignee?.id || '');
    setShowForm(true);
    setSelectedIssue(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Title is required');
      return;
    }
    const payload = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
    };
    if (editIssue) {
      updateMutation.mutate({ id: editIssue.id, d: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  // Issue Detail View
  if (selectedIssue) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="max-w-2xl">
            <button onClick={() => setSelectedIssue(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 mb-4">
              ← Back to Issues
            </button>
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">{selectedIssue.title}</h1>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedIssue.status]}`}>{selectedIssue.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedIssue.priority]}`}>{selectedIssue.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedIssue)} className="text-sm text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10">Edit</button>
                  {selectedIssue.creator?.id === user?.id && (
                    <button onClick={() => setConfirmDelete(selectedIssue.id)} className="text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">Delete</button>
                  )}
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-600 dark:text-slate-300">
                <p><span className="font-medium text-gray-700 dark:text-slate-200">Description:</span> {selectedIssue.description || 'No description'}</p>
                <p><span className="font-medium text-gray-700 dark:text-slate-200">Assignee:</span> {selectedIssue.assignee?.name || 'Unassigned'}</p>
                <p><span className="font-medium text-gray-700 dark:text-slate-200">Creator:</span> {selectedIssue.creator?.name}</p>
                <p><span className="font-medium text-gray-700 dark:text-slate-200">Due Date:</span> {selectedIssue.dueDate ? new Date(selectedIssue.dueDate).toLocaleDateString() : 'No due date'}</p>
                <p><span className="font-medium text-gray-700 dark:text-slate-200">Created:</span> {new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <Comments issueId={selectedIssue.id} />
          </div>
          <ConfirmModal
            isOpen={!!confirmDelete}
            title="Delete Issue"
            message="Are you sure you want to delete this issue?"
            confirmLabel="Delete"
            onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); }}
            onCancel={() => setConfirmDelete(null)}
          />
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Issues</h1>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              + New Issue
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              className={inputClass}
              placeholder="🔍 Search by title, description, or assignee..."
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as IssueStatus | ''); setPage(1); }} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value as IssuePriority | ''); setPage(1); }} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterAssignee} onChange={(e) => { setFilterAssignee(e.target.value); setPage(1); }} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Assignees</option>
              {membersError ? (
                <option value="" disabled>Failed to load members</option>
              ) : (
                members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)
              )}
            </select>
            {(searchInput || filterStatus || filterPriority || filterAssignee) && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setFilterStatus('');
                  setFilterPriority('');
                  setFilterAssignee('');
                  setPage(1);
                }}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                ✕ Reset Filters
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 mb-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 dark:text-slate-100 mb-4">{editIssue ? 'Edit Issue' : 'Create New Issue'}</h2>
              {formError && <ErrorMessage message={formError} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Issue title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Issue description" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus)} className={inputClass}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)} className={inputClass}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Due Date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Assignee</label>
                    <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputClass}>
                      <option value="">Unassigned</option>
                      {members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {editIssue ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-700">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Loading / Error / Empty */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
          {!isLoading && data?.data.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border rounded-xl p-12 text-center">
              <p className="text-gray-400 dark:text-slate-500 text-sm">No issues found</p>
            </div>
          )}

          {/* Issues List */}
          <div className="space-y-3">
            {data?.data.map((issue: Issue) => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 dark:text-slate-100">{issue.title}</h3>
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

{/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500 dark:text-slate-400">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800">Previous</button>
                <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-300">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-800">Next</button>
              </div>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={!!confirmDelete}
          title="Delete Issue"
          message="Are you sure you want to delete this issue? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); }}
          onCancel={() => setConfirmDelete(null)}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}