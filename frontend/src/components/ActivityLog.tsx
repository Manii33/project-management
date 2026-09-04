'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Activity } from '@/lib/types';
import LoadingSpinner from './ui/LoadingSpinner';

const ACTION_LABELS: Record<string, string> = {
  ISSUE_CREATED: '🆕 created issue',
  ISSUE_UPDATED: '✏️ updated issue',
  ISSUE_DELETED: '🗑️ deleted issue',
  ISSUE_ASSIGNED: '👤 assigned issue',
  ISSUE_STATUS_CHANGED: '🔄 changed status of',
  COMMENT_ADDED: '💬 commented on',
  COMMENT_DELETED: '🗑️ deleted comment on',
  MEMBER_JOINED: '➕ added member',
  MEMBER_REMOVED: '➖ removed member',
};

function getActivityMessage(activity: Activity): string {
  const label = ACTION_LABELS[activity.action] || activity.action;
  const meta = activity.meta || {};

  switch (activity.action) {
    case 'ISSUE_CREATED':
    case 'ISSUE_DELETED':
      return `${label} "${meta.issueTitle}"`;
    case 'ISSUE_STATUS_CHANGED':
      return `${label} "${meta.issueTitle}" from ${meta.from} to ${meta.to}`;
    case 'ISSUE_ASSIGNED':
      return `${label} "${meta.issueTitle}"`;
    case 'MEMBER_JOINED':
      return `${label} ${meta.memberName}`;
    case 'MEMBER_REMOVED':
      return `${label} ${meta.memberName}`;
    default:
      return label;
  }
}

interface Props {
  projectId: string;
}

export default function ActivityLog({ projectId }: Props) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity', projectId],
    queryFn: async () => {
      const res = await api.get<Activity[]>(`/projects/${projectId}/activity?limit=20`);
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner size="sm" />;

  return (
    <div className="bg-white border rounded-xl p-4 sm:p-6 shadow-sm mt-4">
      <h2 className="font-semibold text-gray-700 mb-4">Recent Activity</h2>

      {activities?.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">No activity yet</p>
      )}

      <div className="space-y-3">
        {activities?.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {activity.user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 break-words">
                <span className="font-medium">{activity.user?.name}</span>{' '}
                {getActivityMessage(activity)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}