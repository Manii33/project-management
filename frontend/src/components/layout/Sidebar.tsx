'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/lib/hooks/useRole';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Project, Issue, PaginatedResponse } from '@/lib/types';

const PROJECT_DOTS: Record<string, string> = {
  ACTIVE: 'bg-indigo-400',
  PLANNING: 'bg-amber-400',
  COMPLETED: 'bg-emerald-400',
  ARCHIVED: 'bg-zinc-400',
};

const navItems = [
  { href: '/', label: 'Overview', icon: 'grid' },
  { href: '/issues', label: 'Issues', icon: 'issue' },
  { href: '/projects', label: 'Projects', icon: 'board' },
  { href: '/admin/users', label: 'Team', icon: 'team', adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useRole();

  const { data: projects } = useQuery({
    queryKey: ['sidebar', 'projects'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Project>>('/projects?page=1&limit=100');
      return res.data;
    },
  });

  const { data: issues } = useQuery({
    queryKey: ['sidebar', 'issues'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Issue>>('/issues?limit=1000');
      return res.data;
    },
  });

  const openCounts = new Map<string, number>();
  issues?.data.forEach((i) => {
    if (i.status !== 'DONE') {
      openCounts.set(i.project.id, (openCounts.get(i.project.id) ?? 0) + 1);
    }
  });

  const projectsToShow = (projects?.data ?? []).slice(0, 6);

  const activeClass =
    'bg-violet-500/10 text-violet-700 dark:bg-zinc-800/70 dark:text-white dark:border-indigo-400';
  const idleClass =
    'text-slate-500 hover:bg-violet-50/70 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-100';

  const activeNavId = pathname === '/' ? '/' : pathname.startsWith('/issues') ? '/issues' : pathname.startsWith('/admin') ? '/admin/users' : '/projects';
  const visibleNav = navItems.filter((n) => !n.adminOnly || isAdmin);

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-violet-100/80 dark:bg-[#0d0d0f] dark:border-zinc-800/80 flex flex-col">
      {/* Logo + version */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-500/25">
              P
            </div>
            <span className="text-[15px] font-semibold text-slate-800 dark:text-zinc-100 tracking-tight">ProjectHub</span>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-500 dark:bg-zinc-800 dark:text-zinc-400">
            v1.0
          </span>
        </div>
      </div>

      {/* Workspace nav */}
      <div className="px-3">
        <p className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-violet-400 dark:text-zinc-500">
          Workspace
        </p>
        <div className="space-y-0.5">
          {visibleNav.map((item, idx) => {
            const active = item.href === '/' ? activeNavId === '/' : activeNavId.startsWith(item.href);
            return (
              <Link
                key={`${item.label}-${idx}`}
                href={item.href}
                className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  active ? activeClass : idleClass
                }`}
              >
                {item.icon === 'grid' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                )}
                {item.icon === 'issue' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v.01M12 8v4" />
                  </svg>
                )}
                {item.icon === 'board' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="4.5" height="16" rx="1.5" />
                    <rect x="9.75" y="4" width="4.5" height="10" rx="1.5" />
                    <rect x="16.5" y="4" width="4.5" height="7" rx="1.5" />
                  </svg>
                )}
                {item.icon === 'team' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 17.25v1.5A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75v-1.5m12-6a3 3 0 11-6 0 3 3 0 016 0zm3 1.5v.01M18 21v-3a2.25 2.25 0 00-.75-1.69M21 17.25v1.5a2.25 2.25 0 01-2.25 2.25h-1" />
                  </svg>
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto px-3 mt-6">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-violet-400 dark:text-zinc-500">Projects</p>
          <span className="text-[10px] text-violet-400 dark:text-zinc-600 font-medium">{projects?.total ?? 0}</span>
        </div>
        <div className="space-y-0.5">
          {projectsToShow.map((p) => {
            const open = openCounts.get(p.id) ?? 0;
            const active = pathname === `/projects/${p.id}`;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}/dashboard`}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-[13px] transition-colors ${
                  active
                    ? 'bg-violet-50 text-violet-700 dark:bg-zinc-800/70 dark:text-zinc-100'
                    : 'text-slate-500 hover:bg-violet-50/60 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${PROJECT_DOTS[p.status] ?? 'bg-violet-400'}`} />
                <span className="flex-1 truncate">{p.name}</span>
                {open > 0 && (
                  <span className="text-[11px] font-medium text-violet-400 dark:text-zinc-400 tabular-nums">{open}</span>
                )}
              </Link>
            );
          })}
          {projectsToShow.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-zinc-600 px-2.5 py-1.5">No projects yet</p>
          )}
        </div>
      </div>
    </aside>
  );
}