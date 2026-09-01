'use client';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { useRole } from '@/lib/hooks/useRole';
import { useTheme } from '@/context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project, Issue, PaginatedResponse } from '@/lib/types';

const cardBase =
  'bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-800';

export default function HomePage() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { theme, toggleTheme } = useTheme();

  const { data: projects } = useQuery({
    queryKey: ['dashboard', 'projects'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Project>>('/projects?page=1&limit=1');
      return res.data;
    },
  });

  const { data: issues } = useQuery({
    queryKey: ['dashboard', 'issues'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Issue>>('/issues?limit=1');
      return res.data;
    },
  });

  const statCards = [
    {
      label: 'Role',
      value: (user?.role ?? 'member').toUpperCase(),
      accent: isAdmin ? 'border-violet-400' : 'border-blue-400',
      badge: isAdmin
        ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30'
        : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    },
    {
      label: 'Status',
      value: 'Active',
      accent: 'border-green-400',
      badge: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
    },
    {
      label: 'Access',
      value: isAdmin ? 'Full' : 'Member',
      accent: isAdmin ? 'border-violet-400' : 'border-blue-400',
      badge: isAdmin
        ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30'
        : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    },
    {
      label: 'Theme',
      value: theme === 'dark' ? 'Dark' : 'Light',
      accent: theme === 'dark' ? 'border-violet-400' : 'border-amber-400',
      badge: theme === 'dark'
        ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30'
        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
      toggle: true,
    },
  ];

  const actionCards = [
    {
      href: '/projects',
      icon: '📁',
      title: 'Projects',
      metric: projects ? `${projects.total} total` : '—',
      tint: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:group-hover:bg-indigo-500/25',
      hover: 'hover:border-indigo-300',
      titleColor: 'text-slate-800 dark:text-slate-100',
      subtitleColor: 'text-xs text-slate-400 dark:text-slate-400',
    },
    {
      href: '/issues',
      icon: '🐛',
      title: 'My Issues',
      metric: issues ? `${issues.total} issues` : '—',
      tint: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:group-hover:bg-emerald-500/25',
      hover: 'hover:border-emerald-300',
      titleColor: 'text-slate-800 dark:text-slate-100',
      subtitleColor: 'text-xs text-slate-400 dark:text-slate-400',
    },
  ];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user?.name}</span> 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Here&apos;s what&apos;s happening in your workspace.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
            {statCards.map((s) => {
              const Tag = s.toggle ? 'button' : 'div';
              return (
                <Tag
                  key={s.label}
                  type={s.toggle ? 'button' : undefined}
                  onClick={s.toggle ? toggleTheme : undefined}
                  className={`${cardBase} border-l-4 ${s.accent} p-4 ${
                    s.toggle ? 'focus:outline-none focus:ring-2 focus:ring-violet-500 text-left cursor-pointer' : ''
                  }`}
                >
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide dark:text-slate-400">
                    {s.label}
                  </p>
                  <div className="mt-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold border ${s.badge}`}>
                      {s.value}
                    </span>
                  </div>
                  {s.toggle && (
                    <span className="block mt-3 text-xs text-slate-400 dark:text-slate-500">Click to switch</span>
                  )}
                </Tag>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-3">
            {actionCards.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`${cardBase} ${a.hover} p-5 group flex flex-col`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors ${a.tint}`}>
                    <span>{a.icon}</span>
                  </div>
                  <span className="text-slate-300 group-hover:text-indigo-500 text-lg transition-colors dark:text-slate-500 dark:group-hover:text-indigo-400">→</span>
                </div>
                <h3 className={`font-semibold ${a.titleColor} mt-4 mb-0.5`}>{a.title}</h3>
                <p className={a.subtitleColor}>
                  {a.metric} · {a.title === 'Projects' ? 'manage' : 'track'} here
                </p>
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/projects"
                className={`${cardBase} hover:border-violet-300 p-5 group flex flex-col`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-colors bg-violet-50 text-violet-600 group-hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:group-hover:bg-violet-500/25">
                    <span>➕</span>
                  </div>
                  <span className="text-slate-300 group-hover:text-violet-500 text-lg transition-colors dark:text-slate-500 dark:group-hover:text-violet-400">→</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-0.5">New Project</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400">Create a new project</p>
              </Link>
            )}
          </div>

          {/* Account Details */}
          <div className={`${cardBase} p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700 dark:bg-violet-500/20 dark:text-violet-300'}`}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{user?.name}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${isAdmin ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'}`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-400 mt-2 select-all bg-slate-50 border border-slate-200 rounded-md px-2 py-1 inline-block dark:bg-slate-800 dark:border-slate-700">
                    {user?.id}
                  </p>
                </div>
              </div>
              <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-400 shrink-0">
                Account Details
              </span>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
