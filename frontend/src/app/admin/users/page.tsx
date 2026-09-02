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
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Admin Panel
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage user roles across the system
              </p>
            </div>

            {!isLoading && users && (
              <div className="flex gap-3">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {users?.filter((u) => u.role === UserRole.ADMIN).length || 0}{' '}
                  Admin(s)
                </span>

                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {users?.length || 0} Total Users
                </span>
              </div>
            )}
          </div>

          {isLoading && <LoadingSpinner />}

          {error && <ErrorMessage message="Failed to load users" />}

          {!isLoading && users && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs border-b border-slate-200 dark:border-slate-700">
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
                        className="border-t border-slate-100 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${u.role === UserRole.ADMIN ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-200'}`}>
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {u.name}

                              {isSelf && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {u.email}
                        </td>

                        <td className="px-4 py-3.5 text-slate-400 dark:text-slate-500 text-xs">
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
                            className={`rounded-lg px-2.5 py-1.5 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 ${u.role === UserRole.ADMIN ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`}
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-4xl mb-3 text-slate-300">👥</p>
              <p className="text-slate-500 dark:text-slate-300 font-medium">No users found</p>
            </div>
          )}

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-500 inline-block" />
            Note: Role changes take effect for that user after they log in again.
          </p>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}