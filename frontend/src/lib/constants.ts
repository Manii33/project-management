import { IssueStatus, IssuePriority } from './types';

export const STATUS_COLORS: Record<IssueStatus, string> = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
};

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export const STATUSES: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export const PRIORITIES: IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
