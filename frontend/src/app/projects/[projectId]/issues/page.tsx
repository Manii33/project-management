'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Issue, IssueStatus, IssuePriority, ProjectMember, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Comments from '@/components/Comments';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/lib/hooks/useDebounce';

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
  const { data, isLoading, error } = useQuery({
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
  const { data: members } = useQuery({
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
            <button onClick={() => setSelectedIssue(null)} className="text-sm text-gray-500 hover:text-gray-700 mb-4">
              ← Back to Issues
            </button>
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{selectedIssue.title}</h1>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedIssue.status]}`}>{selectedIssue.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedIssue.priority]}`}>{selectedIssue.priority}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedIssue)} className="text-sm text-blue-600 border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Edit</button>
                  {selectedIssue.creator?.id === user?.id && (
                    <button onClick={() => setConfirmDelete(selectedIssue.id)} className="text-sm text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Delete</button>
                  )}
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <p><span className="font-medium text-gray-700">Description:</span> {selectedIssue.description || 'No description'}</p>
                <p><span className="font-medium text-gray-700">Assignee:</span> {selectedIssue.assignee?.name || 'Unassigned'}</p>
                <p><span className="font-medium text-gray-700">Creator:</span> {selectedIssue.creator?.name}</p>
                <p><span className="font-medium text-gray-700">Due Date:</span> {selectedIssue.dueDate ? new Date(selectedIssue.dueDate).toLocaleDateString() : 'No due date'}</p>
                <p><span className="font-medium text-gray-700">Created:</span> {new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Issues</h1>
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
              {members?.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
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
                className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                ✕ Reset Filters
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4">{editIssue ? 'Edit Issue' : 'Create New Issue'}</h2>
              {formError && <ErrorMessage message={formError} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Issue title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Issue description" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus)} className={inputClass}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)} className={inputClass}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
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
                  <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Loading / Error / Empty */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load issues" />}
          {!isLoading && data?.data.length === 0 && (
            <div className="bg-white border rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">No issues found</p>
            </div>
          )}

          {/* Issues List */}
          <div className="space-y-3">
            {data?.data.map((issue: Issue) => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
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

          {/* Pagination */}
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