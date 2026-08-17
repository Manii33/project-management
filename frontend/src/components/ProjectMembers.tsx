'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ProjectMember, User } from '@/lib/types';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import ConfirmModal from './ui/ConfirmModal';

interface Props {
  projectId: string;
  ownerId: string;
  isOwner: boolean;
}

export default function ProjectMembers({ projectId, ownerId, isOwner }: Props) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [addError, setAddError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Fetch members
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const res = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
      return res.data;
    },
  });

  // Fetch all users (for adding)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<User[]>('/users');
      return res.data;
    },
    enabled: isOwner,
  });

  const addMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/projects/${projectId}/members`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setUserId('');
      setAddError('');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
  setAddError(error.response?.data?.message || 'Failed to add member');
},
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setConfirmRemove(null);
    },
  });

  // Filter out already added members
  const availableUsers = users?.filter(
    (u) => u.id !== ownerId && !members?.some((m) => m.user.id === u.id)
  );

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm mt-4">
      <h2 className="font-semibold text-gray-700 mb-4">Project Members</h2>

      {/* Add Member — Owner Only */}
      {isOwner && (
        <div className="mb-5">
          <div className="flex gap-2">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a user to add...</option>
              {availableUsers?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!userId) return;
                addMutation.mutate(userId);
              }}
              disabled={!userId || addMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
          {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
        </div>
      )}

      {/* Members List */}
      {isLoading && <LoadingSpinner size="sm" />}
      {error && <ErrorMessage message="Failed to load members" />}

      {members?.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">No members yet</p>
      )}

      <div className="space-y-2">
        {members?.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{member.user.name}</p>
                <p className="text-xs text-gray-400">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {new Date(member.joinedAt).toLocaleDateString()}
              </span>
              {isOwner && member.user.id !== ownerId && (
                <button
                  onClick={() => setConfirmRemove(member.user.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!confirmRemove}
        title="Remove Member"
        message="Are you sure you want to remove this member from the project?"
        confirmLabel="Remove"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={() => {
          if (confirmRemove) removeMutation.mutate(confirmRemove);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}