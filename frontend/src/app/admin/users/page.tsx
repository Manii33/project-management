'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { getErrorMessage } from '@/lib/api';
import { User, UserRole } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useAuth } from '@/context/AuthContext';

type AdminUser = User & { createdAt?: string };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<AdminUser[]>('/users');
      return res.data;
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const res = await api.patch<User>(`/users/${id}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      setActionError('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      setActionError(getErrorMessage(err));
    },
  });

  const handleRoleChange = (target: User, role: UserRole) => {
    if (role === target.role) return;
    changeRole.mutate({ id: target.id, role });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-sm text-gray-500 mt-1">Manage user roles across the system</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium self-start">
              {users?.filter((u) => u.role === UserRole.ADMIN).length || 0} Admin(s)
            </span>
          </div>

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load users" />}

          {!isLoading && users && (
            <div className="bg-white border rounded-xl shadow-sm overflow-visible">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-sm text-left min-w-[540px]">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isLastAdmin =
                      u.role === UserRole.ADMIN &&
                      users.filter((x) => x.role === UserRole.ADMIN).length === 1;
                    return (
                      <tr key={u.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            disabled={changeRole.isPending || (isSelf && isLastAdmin)}
                            title={isLastAdmin ? 'At least one admin is required' : undefined}
                            className={`rounded-lg px-2 py-1.5 border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              u.role === UserRole.ADMIN
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-gray-50 text-gray-700 border-gray-200'
                            }`}
                          >
                            <option value={UserRole.MEMBER}>Member</option>
                            <option value={UserRole.ADMIN}>Admin</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>

              {actionError && (
                <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-red-600 text-sm">
                  {actionError}
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && users?.length === 0 && (
            <div className="bg-white border rounded-xl p-6 sm:p-12 text-center">
              <p className="text-gray-400 text-sm">No users found</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">
            Note: Role changes take effect for that user after they log in again.
          </p>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
