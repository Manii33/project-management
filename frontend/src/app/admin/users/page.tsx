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

    changeRole.mutate({
      id: target.id,
      role,
    });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Admin Panel
              </h1>

              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Manage user roles across the system
              </p>
            </div>

            {!isLoading && users && (
              <div className="flex gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {users?.filter((u) => u.role === UserRole.ADMIN).length || 0}{' '}
                  Admin(s)
                </span>

                <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {users?.length || 0} Total Users
                </span>
              </div>
            )}
          </div>

          {isLoading && <LoadingSpinner />}

          {error && <ErrorMessage message="Failed to load users" />}

          {!isLoading && users && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 uppercase text-xs border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold tracking-wide">User</th>
                    <th className="px-4 py-3.5 font-semibold tracking-wide">Email</th>
                    <th className="px-4 py-3.5 font-semibold tracking-wide">Joined</th>
                    <th className="px-4 py-3.5 font-semibold tracking-wide text-right">Role</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;

                    const isLastAdmin =
                      u.role === UserRole.ADMIN &&
                      users.filter((x) => x.role === UserRole.ADMIN).length ===
                        1;

                    return (
                      <tr
                        key={u.id}
                        className="border-t border-gray-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${u.role === UserRole.ADMIN ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'}`}>
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-medium text-gray-800 dark:text-slate-100">
                              {u.name}

                              {isSelf && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-gray-500 dark:text-slate-400">
                          {u.email}
                        </td>

                        <td className="px-4 py-3.5 text-gray-400 dark:text-slate-500 text-xs">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : '—'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(
                                u,
                                e.target.value as UserRole
                              )
                            }
                            disabled={
                              changeRole.isPending ||
                              (isSelf && isLastAdmin)
                            }
                            title={
                              isLastAdmin
                                ? 'At least one admin is required'
                                : undefined
                            }
                            className={`rounded-lg px-2.5 py-1.5 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 ${u.role === UserRole.ADMIN ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30' : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-700'}`}
                          >
                            <option value={UserRole.MEMBER}>
                              Member
                            </option>

                            <option value={UserRole.ADMIN}>
                              Admin
                            </option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {actionError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-500/10 border-t border-red-100 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                  {actionError}
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && users?.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-gray-500 dark:text-slate-300 font-medium">No users found</p>
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-500 inline-block" />
            Note: Role changes take effect for that user after they log in again.
          </p>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}