'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { getErrorMessage } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Issue } from '@/lib/types';

interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  inReview: number;
  todo: number;
  overdue: number;
  completionPercent: number;
  byStatus: { status: string; count: string }[];
  byPriority: { priority: string; count: string }[];
  byAssignee: { id: string; name: string; count: string }[];
  recentActivity: Issue[];
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: async () => {
      const res = await api.get<DashboardStats>(`/projects/${projectId}/dashboard`);
      return res.data;
    },
  });

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 hover:text-gray-700 p-2 -ml-1"
            >
              ←
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Project Dashboard</h1>
          </div>

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}

          {data && (
            <div className="space-y-6">

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total" value={data.total} color="bg-gray-50 border-gray-200" />
                <StatCard label="Todo" value={data.todo} color="bg-gray-50 border-gray-200" />
                <StatCard label="In Progress" value={data.inProgress} color="bg-blue-50 border-blue-200" />
                <StatCard label="In Review" value={data.inReview} color="bg-yellow-50 border-yellow-200" />
                <StatCard label="Completed" value={data.completed} color="bg-green-50 border-green-200" />
                <StatCard label="Overdue" value={data.overdue} color="bg-red-50 border-red-200" textColor="text-red-600" />
              </div>

              {/* Completion Progress */}
              <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-700">Completion</h2>
                  <span className="text-xl sm:text-2xl font-bold text-green-600">{data.completionPercent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ width: `${data.completionPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* By Status */}
              <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-4">Issues by Status</h2>
                  <div className="space-y-3">
                    {data.byStatus.map((s) => (
                      <div key={s.status} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                          {s.status}
                        </span>
                        <div className="flex items-center gap-2 flex-1 mx-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${data.total > 0 ? (Number(s.count) / data.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Priority */}
                <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm">
                  <h2 className="font-semibold text-gray-700 mb-4">Issues by Priority</h2>
                  <div className="space-y-3">
                    {data.byPriority.map((p) => (
                      <div key={p.priority} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[p.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {p.priority}
                        </span>
                        <div className="flex items-center gap-2 flex-1 mx-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-orange-400 h-2 rounded-full"
                              style={{ width: `${data.total > 0 ? (Number(p.count) / data.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By Assignee */}
              {data.byAssignee.length > 0 && (
                <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm">
                  <h2 className="font-semibold text-gray-700 mb-4">Issues by Assignee</h2>
                  <div className="space-y-3">
                    {data.byAssignee.map((a) => (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 flex-1">{a.name}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${data.total > 0 ? (Number(a.count) / data.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{a.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {data.recentActivity.map((issue) => (
                    <div key={issue.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                        {issue.creator?.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 break-words">{issue.title}</p>
                        <p className="text-xs text-gray-400">
                          by {issue.creator?.name} • {new Date(issue.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[issue.status]}`}>
                        {issue.status}
                      </span>
                    </div>
                  ))}
                  {data.recentActivity.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No activity yet</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  color,
  textColor = 'text-gray-800',
}: {
  label: string;
  value: number;
  color: string;
  textColor?: string;
}) {
  return (
    <div className={`border rounded-xl p-4 shadow-sm ${color}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}