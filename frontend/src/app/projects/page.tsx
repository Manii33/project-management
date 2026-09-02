'use client';
import ActivityLog from '@/components/ActivityLog';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRole } from '@/lib/hooks/useRole';
import api, { getErrorMessage } from '@/lib/api';
import { Project, ProjectStatus, PaginatedResponse } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ProjectMembers from '@/components/ProjectMembers';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const inputClass =
  'w-full bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  COMPLETED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  ARCHIVED: 'bg-slate-100 text-slate-500 dark:bg-slate-500/15 dark:text-slate-300',
};

const STATUS_DOTS: Record<ProjectStatus, string> = {
  PLANNING: 'bg-amber-500',
  ACTIVE: 'bg-emerald-500',
  COMPLETED: 'bg-indigo-500',
  ARCHIVED: 'bg-slate-400',
};

const STATUSES: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];

export default function ProjectsPage() {
  const { isAdmin } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('');
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects', filterStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const res = await api.get<PaginatedResponse<Project>>(`/projects?${params.toString()}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: { name: string; description: string; status: ProjectStatus }) =>
      api.post('/projects', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
    },
    onError: () => setFormError('Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: { name: string; description: string; status: ProjectStatus } }) =>
      api.put(`/projects/${id}`, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
      setSelectedProject(null);
    },
    onError: () => setFormError('Failed to update project'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/projects/${id}/archive`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSelectedProject(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditProject(null);
    setName('');
    setDescription('');
    setStatus('PLANNING');
    setFormError('');
  };

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setName(project.name);
    setDescription(project.description);
    setStatus(project.status);
    setShowForm(true);
    setSelectedProject(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (editProject) {
      updateMutation.mutate({ id: editProject.id, d: { name, description, status } });
    } else {
      createMutation.mutate({ name, description, status });
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  // Project Detail View
  if (selectedProject) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="max-w-3xl">
            <button
              onClick={() => setSelectedProject(null)}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mb-5 flex items-center gap-1 hover:gap-2 transition-all"
            >
              ← Back to Projects
            </button>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <Link href={`/projects/${selectedProject.id}/dashboard`} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors">
                Dashboard
              </Link>
              <Link href={`/projects/${selectedProject.id}/issues`} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors">
                Issues
              </Link>
              <Link href={`/projects/${selectedProject.id}/kanban`} className="bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Kanban
              </Link>
            </div>

            {/* Project Info Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-4">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                    {selectedProject.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedProject.name}</h1>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedProject.status]}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(selectedProject)} className="text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10">Edit</button>
                    <button onClick={() => archiveMutation.mutate(selectedProject.id)} className="text-sm text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10">Archive</button>
                    <button onClick={() => setConfirmDelete(selectedProject.id)} className="text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">Delete</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Description</p>
                  <p className="text-slate-700 dark:text-slate-200">{selectedProject.description || 'No description'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Owner</p>
                  <p className="text-slate-700 dark:text-slate-200 font-medium">{selectedProject.owner?.name}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Created</p>
                  <p className="text-slate-700 dark:text-slate-200">{new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Last Updated</p>
                  <p className="text-slate-700 dark:text-slate-200">{new Date(selectedProject.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <ProjectMembers
              projectId={selectedProject.id}
              ownerId={selectedProject.owner?.id}
              isOwner={user?.id === selectedProject.owner?.id}
            />
            {isAdmin && <ActivityLog projectId={selectedProject.id} />}
          </div>

          <ConfirmModal
            isOpen={!!confirmDelete}
            title="Delete Project"
            message="Are you sure you want to delete this project? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => { if (confirmDelete) { deleteMutation.mutate(confirmDelete); setConfirmDelete(null); } }}
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
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Projects</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage and track your projects</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-500/20"
              >
                + New Project
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex gap-1.5 flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => { setFilterStatus(''); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === '' ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >All</button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(s); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === s ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm dark:shadow-none' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >{s}</button>
              ))}
            </div>
            {!isLoading && data && data.total > 0 && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 text-xs font-medium">
                {data.total} project{data.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Form */}
          {isAdmin && showForm && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-6 shadow-sm">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">{editProject ? 'Edit Project' : 'Create New Project'}</h2>
              {formError && <ErrorMessage message={formError} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Project name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Project description" rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className={inputClass}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500 disabled:opacity-50">
                    {editProject ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={resetForm} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Loading / Error / Empty */}
          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
          {!isLoading && data?.data.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-4xl mb-3 text-slate-300">🗂️</p>
              <p className="text-slate-500 dark:text-slate-300 font-medium">{filterStatus ? `No ${filterStatus.toLowerCase()} projects` : 'No projects found'}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{filterStatus ? 'Try selecting a different status.' : 'Get started by creating your first project'}</p>
              {!filterStatus && isAdmin && (
                <button onClick={() => setShowForm(true)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500">
                  + New Project
                </button>
              )}
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-3">
            {data?.data.map((project: Project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 transition-colors">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOTS[project.status]}`} />
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status]}`}>{project.status}</span>
                        </span>
                      </div>
                      {project.description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-1">{project.description}</p>}
                      <div className="flex items-center gap-5 mt-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                            {project.owner?.name.charAt(0).toUpperCase()}
                          </span>
                          {project.owner?.name}
                        </span>
                        <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {isAdmin && (
                      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEdit(project)} className="text-xs text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">Edit</button>
                        <button onClick={() => archiveMutation.mutate(project.id)} className="text-xs text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">Archive</button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(project.id); }} className="text-xs text-red-600 dark:text-red-400 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>
                      </div>
                    )}
                    <span className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 text-lg transition-colors">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">← Previous</button>
                <span className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 font-medium">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={!!confirmDelete}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => { if (confirmDelete) { deleteMutation.mutate(confirmDelete); setConfirmDelete(null); } }}
          onCancel={() => setConfirmDelete(null)}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}