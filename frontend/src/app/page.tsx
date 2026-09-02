'use client';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useExportData } from '@/lib/export-context';
import { formatDateRange } from '@/lib/date';
import { Issue, Project, PaginatedResponse, UserRole } from '@/lib/types';

const METRIC_META: Record<string, { tint: string; bar: string; gradient: string; iconBg: string; iconColor: string; sub: string }> = {
  'Open Issues': {
    tint: 'text-slate-800 dark:text-sky-300',
    bar: 'bg-sky-400 dark:bg-sky-400',
    gradient: 'from-white to-sky-50 dark:from-zinc-900 dark:to-sky-950/50',
    iconBg: 'bg-sky-100/70 dark:bg-sky-500/20',
    iconColor: 'text-sky-500 dark:text-sky-300',
    sub: 'Awaiting start',
  },
  'In Progress': {
    tint: 'text-indigo-700 dark:text-indigo-300',
    bar: 'bg-indigo-400 dark:bg-indigo-400',
    gradient: 'from-white to-indigo-50 dark:from-zinc-900 dark:to-indigo-950/60',
    iconBg: 'bg-indigo-100/70 dark:bg-indigo-500/20',
    iconColor: 'text-indigo-500 dark:text-indigo-300',
    sub: 'Work in motion',
  },
  'In Review': {
    tint: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-400 dark:bg-amber-400',
    gradient: 'from-white to-amber-50 dark:from-zinc-900 dark:to-amber-950/40',
    iconBg: 'bg-amber-100/70 dark:bg-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-300',
    sub: 'Awaiting feedback',
  },
  Critical: {
    tint: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-400 dark:bg-rose-500',
    gradient: 'from-white to-rose-50 dark:from-zinc-900 dark:to-rose-950/40',
    iconBg: 'bg-rose-100/70 dark:bg-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-300',
    sub: 'High priority',
  },
};

const CARD_BORDER =
  'border border-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-6px_rgba(15,23,42,0.10)] dark:border-zinc-700/60 dark:shadow-black/40';

const TABS = [
  'Member Performance',
  'Status Breakdown',
  'Project Performance',
  'Overall Summary',
];

const STATUS_DOT: Record<string, string> = {
  TODO: 'bg-zinc-400',
  IN_PROGRESS: 'bg-indigo-400',
  IN_REVIEW: 'bg-amber-400',
  DONE: 'bg-emerald-400',
};

function MetricIcon({ label }: { label: string }) {
  const common = { className: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 };
  switch (label) {
    case 'Open Issues':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      );
    case 'In Progress':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      );
    case 'In Review':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
  }
}

const TAB_CONTENT: Record<
  string,
  { heading: string; sub: string; render: (issues: Issue[]) => ReactElement }
> = {
  'Member Performance': {
    heading: 'Team member activity',
    sub: 'How each member is tracking across your issues',
    render: fnMembers,
  },
  'Status Breakdown': {
    heading: 'Status breakdown',
    sub: 'Distribution of issues by status',
    render: fnStatus,
  },
  'Project Performance': {
    heading: 'Project performance',
    sub: 'Completion across all your projects',
    render: fnProjects,
  },
  'Overall Summary': {
    heading: 'Workspace summary',
    sub: 'Everything across all projects',
    render: fnOverall,
  },
};

function fnMembers(issues: Issue[]): ReactElement {
  const byAssignee = new Map<string, { name: string; role?: string; done: number; total: number; inProgress: number }>();
  issues.forEach((i) => {
    const actor = i.assignee ?? i.creator;
    if (!actor) return;
    const key = actor.id;
    const cur = byAssignee.get(key) ?? { name: actor.name, role: actor.role, done: 0, total: 0, inProgress: 0 };
    cur.total += 1;
    if (i.status === 'DONE') cur.done += 1;
    if (i.status === 'IN_PROGRESS') cur.inProgress += 1;
    byAssignee.set(key, cur);
  });
  const rows = [...byAssignee.entries()].sort((a, b) => b[1].total - a[1].total);
  const Empty = <EmptyState msg="No member activity yet." />;
  if (rows.length === 0) return Empty;
  return (
    <div className="space-y-5">
      {rows.map(([id, r]) => {
        const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
        const isAdmin = r.role === UserRole.ADMIN;
        return (
          <div key={id} className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                {r.name.charAt(0).toUpperCase()}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${pct === 100 ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-slate-700 dark:text-zinc-100 truncate">{r.name}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${isAdmin ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-300'}`}>
                    {isAdmin ? 'Admin' : 'Member'}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
                  {pct}% complete
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                {r.total} assigned · {r.done} done · {r.inProgress} in progress
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fnStatus(issues: Issue[]): ReactElement {
  if (issues.length === 0) return <EmptyState msg="No status data yet." />;
  const order = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const labels: Record<string, string> = {
    TODO: 'Open',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
  };
  const counts = new Map<string, number>();
  issues.forEach((i) => counts.set(i.status, (counts.get(i.status) ?? 0) + 1));
  return (
    <div className="space-y-4">
      {order.map((s) => {
        const c = counts.get(s) ?? 0;
        const pct = issues.length > 0 ? Math.round((c / issues.length) * 100) : 0;
        const bar = STATUS_DOT[s] ?? 'bg-zinc-400';
        return (
          <div key={s}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-300">
                <span className={`w-2.5 h-2.5 rounded-full ${bar}`} />
                {labels[s]}
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">{c} ({pct}%)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
              <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fnProjects(issues: Issue[]): ReactElement {
  if (issues.length === 0) return <EmptyState msg="No project activity yet." />;
  const byProject = new Map<string, { name: string; done: number; total: number }>();
  issues.forEach((i) => {
    const key = i.project.id;
    const cur = byProject.get(key) ?? { name: i.project.name, done: 0, total: 0 };
    cur.total += 1;
    if (i.status === 'DONE') cur.done += 1;
    byProject.set(key, cur);
  });
  const rows = [...byProject.entries()].sort((a, b) => b[1].total - a[1].total);
  return (
    <div className="space-y-3">
      {rows.map(([id, r]) => {
        const pct = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
        return (
          <div key={id} className="flex items-center gap-4">
            <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[13px] font-semibold text-slate-600 dark:text-slate-300">
              {r.name.charAt(0).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-100 truncate">{r.name}</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums">{r.done}/{r.total}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function fnOverall(issues: Issue[]): ReactElement {
  if (issues.length === 0) return <EmptyState msg="No issues to summarize yet." />;
  const done = issues.filter((i) => i.status === 'DONE').length;
  const open = issues.filter((i) => i.status === 'TODO').length;
  const progress = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const review = issues.filter((i) => i.status === 'IN_REVIEW').length;
  const completion = Math.round((done / issues.length) * 100);
  const rows = [
    { label: 'Done', value: done, dot: 'bg-emerald-400' },
    { label: 'Open', value: open, dot: 'bg-zinc-400' },
    { label: 'In Progress', value: progress, dot: 'bg-indigo-400' },
    { label: 'In Review', value: review, dot: 'bg-amber-400' },
  ];
  return (
    <div>
      <div className="flex items-end gap-3 mb-6">
        <p className="text-5xl font-semibold tracking-tight text-slate-800 dark:text-zinc-50 tabular-nums">
          {completion}%
        </p>
        <p className="text-sm text-slate-400 dark:text-zinc-500 mb-1.5">overall completion</p>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex">
        {[
          { w: done, c: 'bg-emerald-400' },
          { w: progress, c: 'bg-indigo-400' },
          { w: review, c: 'bg-amber-400' },
          { w: open, c: 'bg-slate-300 dark:bg-zinc-600' },
        ].map((seg, idx) => (
          <div key={idx} className={`${seg.c}`} style={{ width: `${(seg.w / issues.length) * 100}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 px-3 py-3">
            <p className="text-xl font-semibold text-slate-800 dark:text-zinc-100 tabular-nums">{r.value}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${r.dot}`} />
              {r.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-sm text-slate-400 dark:text-zinc-600 text-center py-12">{msg}</p>;
}

export default function HomePage() {
  const [tab, setTab] = useState(0);
  const { user } = useAuth();
  const { setData } = useExportData();

  const { data: issuesData } = useQuery({
    queryKey: ['overview', 'issues'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Issue>>('/issues?limit=1000');
      return res.data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ['overview', 'projects'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Project>>('/projects?page=1&limit=100');
      return res.data;
    },
  });

  const issues = useMemo(() => issuesData?.data ?? [], [issuesData]);
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData]);

  const open = issues.filter((i) => i.status === 'TODO').length;
  const inProgress = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const inReview = issues.filter((i) => i.status === 'IN_REVIEW').length;
  const critical = issues.filter((i) => i.priority === 'URGENT' && i.status !== 'DONE').length;

  const metricCards = useMemo(
    () => [
      { label: 'Open Issues', value: open, pct: issues.length > 0 ? Math.round((open / issues.length) * 100) : 0 },
      { label: 'In Progress', value: inProgress, pct: issues.length > 0 ? Math.round((inProgress / issues.length) * 100) : 0 },
      { label: 'In Review', value: inReview, pct: issues.length > 0 ? Math.round((inReview / issues.length) * 100) : 0 },
      { label: 'Critical', value: critical, pct: issues.length > 0 ? Math.round((critical / issues.length) * 100) : 0 },
    ],
    [issues, open, inProgress, inReview, critical]
  );

  const activeTab = TABS[tab];
  const activeContent = TAB_CONTENT[activeTab];

  useEffect(() => {
    if (!user) return;

    const memberMap = new Map<string, { name: string; role: string; done: number; assigned: number; inProgress: number }>();
    issues.forEach((i) => {
      const actor = i.assignee ?? i.creator;
      if (!actor) return;
      const cur = memberMap.get(actor.id) ?? { name: actor.name, role: actor.role, done: 0, assigned: 0, inProgress: 0 };
      cur.assigned += 1;
      if (i.status === 'DONE') cur.done += 1;
      if (i.status === 'IN_PROGRESS') cur.inProgress += 1;
      memberMap.set(actor.id, cur);
    });

    const projectRows = projects.map((p) => {
      const pIssues = issues.filter((x) => x.project.id === p.id);
      const done = pIssues.filter((x) => x.status === 'DONE').length;
      const total = pIssues.length;
      const openCount = pIssues.filter((x) => x.status !== 'DONE').length;
      return {
        name: p.name,
        status: p.status,
        totalIssues: total,
        openIssues: openCount,
        completionPct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    }).sort((a, b) => a.openIssues - b.openIssues || b.totalIssues - a.totalIssues);

    setData({
      dateRange: formatDateRange(),
      generatedAt: new Date().toLocaleString(),
      generatedBy: user.name,
      activeTab,
      metrics: metricCards.map((m) => ({ label: m.label, value: m.value })),
      projects: projectRows,
      members: [...memberMap.entries()]
        .sort((a, b) => b[1].assigned - a[1].assigned)
        .map(([, m]) => ({
          name: m.name,
          role: m.role === UserRole.ADMIN ? 'Admin' : 'Member',
          assigned: m.assigned,
          done: m.done,
          inProgress: m.inProgress,
          completionPct: m.assigned > 0 ? Math.round((m.done / m.assigned) * 100) : 0,
        })),
    });
  }, [issues, projects, user, activeTab, metricCards, setData]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="mx-auto space-y-6">
          {/* Welcome heading */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-zinc-50">
              Welcome Back !
            </h1>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">
              Here&apos;s what&apos;s happening across your workspace today.
            </p>
          </div>

          {/* Four metric cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metricCards.map((m) => {
              const meta = METRIC_META[m.label];
              return (
                <div
                  key={m.label}
                  className={`bg-gradient-to-br ${meta.gradient} rounded-2xl p-5 ${CARD_BORDER}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.iconBg} ${meta.iconColor}`}>
                      <MetricIcon label={m.label} />
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] font-semibold text-slate-500 dark:text-zinc-400">
                    {m.label}
                  </p>
                  <p className={`mt-0.5 text-5xl font-bold leading-tight tracking-tight tabular-nums ${meta.tint}`}>
                    {m.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{m.pct}% of all issues · {meta.sub}</p>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-white/70 dark:bg-zinc-700/40">
                    <div
                      className={`h-1.5 rounded-full ${meta.bar}`}
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Soft rounded tabs directly below the metric cards */}
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-1.5 dark:bg-zinc-900/70 dark:border-zinc-800">
            {TABS.map((t, idx) => (
              <button
                key={t}
                onClick={() => setTab(idx)}
                className={`flex-1 min-w-[150px] rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/70 dark:text-zinc-500 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Large clean white content card */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-8px_rgba(15,23,42,0.12)] p-6 sm:p-8 dark:bg-zinc-900/70 dark:border-zinc-800 dark:shadow-black/40">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-zinc-100">
                {activeContent.heading}
              </h2>
              <p className="text-sm text-slate-400 dark:text-zinc-500 mt-0.5">{activeContent.sub}</p>
            </div>
            {activeContent.render(issues)}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
