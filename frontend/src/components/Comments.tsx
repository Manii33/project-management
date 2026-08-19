'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Comment, UserRole } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/lib/hooks/useRole';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ConfirmModal from './ui/ConfirmModal';

const inputClass = 'w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400';

export default function Comments({ issueId }: { issueId: string }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
  };

  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', issueId],
    queryFn: async () => {
      const res = await api.get<Comment[]>(`/issues/${issueId}/comments`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (c: string) => api.post(`/issues/${issueId}/comments`, { content: c }),
    onSuccess: () => {
      refresh();
      setContent('');
      setFormError('');
    },
    onError: () => setFormError('Failed to add comment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, c }: { id: string; c: string }) =>
      api.put(`/issues/${issueId}/comments/${id}`, { content: c }),
    onSuccess: () => {
      refresh();
      setEditId(null);
      setEditContent('');
    },
    onError: () => setFormError('Failed to update comment'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/issues/${issueId}/comments/${id}`),
    onSuccess: () => {
      refresh();
      setConfirmDelete(null);
    },
  });

  const canModerate = (authorId: string) => user?.id === authorId || isAdmin;

  const handleAdd = () => {
    if (!content.trim()) return;
    createMutation.mutate(content);
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({ id, c: editContent });
  };

  return (
    <div className="mt-6">
      <h2 className="font-semibold text-gray-700 mb-4">Comments</h2>

      {formError && <div className="mb-3"><ErrorMessage message={formError} /></div>}

      {/* Add Comment */}
      <div className="mb-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={inputClass}
          placeholder="Write a comment..."
          rows={2}
        />
        <button
          onClick={handleAdd}
          disabled={!content.trim() || createMutation.isPending}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </div>

      {/* Loading / Error / Empty */}
      {isLoading && <LoadingSpinner size="sm" />}
      {error && <ErrorMessage message="Failed to load comments" />}
      {!isLoading && !error && comments?.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">No comments yet</p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments?.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
              {c.author?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800 text-sm">{c.author?.name}</span>
                  {c.author?.role === UserRole.ADMIN && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-medium uppercase">Admin</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                {canModerate(c.author?.id) && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setEditId(c.id); setEditContent(c.content); }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editId === c.id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={inputClass}
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(c.id)}
                      disabled={!editContent.trim() || updateMutation.isPending}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditId(null); setEditContent(''); }}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmDelete) deleteMutation.mutate(confirmDelete); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}