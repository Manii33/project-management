'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRole } from '@/lib/hooks/useRole';
import api from '@/lib/api';
import { Project } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ConfirmModal from '@/components/ui/ConfirmModal';

const inputClass =
  'w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400';

export default function ProjectsPage() {
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get<Project[]>('/projects');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
    },
    onError: () => setFormError('Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description: string };
    }) => api.put(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
    },
    onError: () => setFormError('Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditProject(null);
    setName('');
    setDescription('');
    setFormError('');
  };

  const handleEdit = (project: Project) => {
    setEditProject(project);
    setName(project.name);
    setDescription(project.description);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (editProject) {
      updateMutation.mutate({
        id: editProject.id,
        data: { name, description },
      });
    } else {
      createMutation.mutate({ name, description });
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + New Project
              </button>
            )}
          </div>

          {isAdmin && showForm && (
            <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
              <h2 className="font-semibold text-gray-700 mb-4">
                {editProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              {formError && <ErrorMessage message={formError} />}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputClass}
                    placeholder="Project description"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {editProject ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load projects" />}

          {projects && projects.length === 0 && (
            <div className="bg-white border rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">No projects yet</p>
              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 text-blue-600 text-sm hover:underline"
                >
                  Create your first project
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {project.description}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-2">
                      Created by {project.createdBy?.name} •{' '}
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(project.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-800 px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ConfirmModal
          isOpen={!!confirmDelete}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            if (confirmDelete) {
              deleteMutation.mutate(confirmDelete);
              setConfirmDelete(null);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      </AppLayout>
    </ProtectedRoute>
  );
}