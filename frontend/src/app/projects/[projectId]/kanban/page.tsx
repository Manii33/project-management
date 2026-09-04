'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { getErrorMessage } from '@/lib/api';
import { Issue, IssueStatus } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const COLUMNS: { id: IssueStatus; label: string; color: string; headerColor: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-50', headerColor: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50', headerColor: 'bg-blue-100' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-50', headerColor: 'bg-yellow-100' },
  { id: 'DONE', label: 'Done', color: 'bg-green-50', headerColor: 'bg-green-100' },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

const PAGE_SIZE = 20;

export default function KanbanPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [dragError, setDragError] = useState('');
  const [localIssues, setLocalIssues] = useState<Issue[]>([]);

  const fetchAllIssues = async () => {
    let page = 1;
    let fetched: Issue[] = [];
    let total = Infinity;

    while (fetched.length < total) {
      const res = await api.get<{ data: Issue[]; total: number }>(
        `/projects/${projectId}/issues?page=${page}&limit=${PAGE_SIZE}`
      );
      fetched = [...fetched, ...res.data.data];
      total = res.data.total;
      if (res.data.data.length < PAGE_SIZE) break;
      page++;
    }

    return fetched.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const { data: issues, isLoading, error, refetch } = useQuery({
    queryKey: ['issues-kanban', projectId],
    queryFn: fetchAllIssues,
  });

  const allIssues = useMemo(() => {
    if (localIssues.length > 0) return localIssues;
    return issues ?? [];
  }, [issues, localIssues]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, order }: { id: string; status: IssueStatus; order: number }) =>
      api.put(`/projects/${projectId}/issues/${id}`, { status, order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      setDragError('');
    },
    onError: () => {
      if (issues) setLocalIssues(issues);
      setDragError('Failed to update status. Please try again.');
    },
  });

  const issuesByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = allIssues.filter((i) => i.status === col.id);
      return acc;
    },
    {} as Record<IssueStatus, Issue[]>,
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const newStatus = destination.droppableId as IssueStatus;
    const newOrder = destination.index;

    const updated = allIssues.map((issue) =>
      issue.id === draggableId
        ? { ...issue, status: newStatus, order: newOrder }
        : issue,
    );
    setLocalIssues(updated);

    updateStatusMutation.mutate({ id: draggableId, status: newStatus, order: newOrder });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-500 hover:text-gray-700 p-2 -ml-1"
              >
                ←
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Kanban Board</h1>
            </div>
            {dragError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 sm:py-2 rounded-lg text-sm break-words">
                {dragError}
              </div>
            )}
          </div>

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}

          {!isLoading && !error && allIssues.length === 0 && (
            <div className="bg-white border rounded-xl p-6 sm:p-12 text-center">
              <p className="text-gray-400 text-sm">No issues on this board yet</p>
              <button
                onClick={() => router.push(`/projects/${projectId}/issues`)}
                className="mt-3 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] sm:min-h-0"
              >
                Create your first issue
              </button>
            </div>
          )}

          {!isLoading && !error && allIssues.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0 lg:min-w-0">
                  {COLUMNS.map((col) => (
                  <div key={col.id} className="flex flex-col min-h-[300px] lg:min-h-96">
                    <div className={`rounded-t-xl px-4 py-3 ${col.headerColor} border border-b-0 border-gray-200`}>
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700 text-sm">{col.label}</h2>
                        <span className="bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200">
                          {issuesByStatus[col.id].length}
                        </span>
                      </div>
                    </div>

                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 p-2 border border-gray-200 rounded-b-xl transition-colors ${
                            snapshot.isDraggingOver
                              ? `${col.color} border-blue-300`
                              : 'bg-gray-50'
                          }`}
                        >
                          {issuesByStatus[col.id].map((issue, index) => (
                            <Draggable
                              key={issue.id}
                              draggableId={issue.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white border border-gray-200 rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing transition-all ${
                                    snapshot.isDragging
                                      ? 'shadow-lg rotate-1 border-blue-300'
                                      : 'shadow-sm hover:shadow-md'
                                  }`}
                                >
                                  <p className="text-sm font-medium text-gray-800 mb-2 break-words">
                                    {issue.title}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                                      {issue.priority}
                                    </span>
                                    {issue.assignee && (
                                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                        {issue.assignee.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  {issue.dueDate && (
                                    <p className="text-xs text-gray-400 mt-2">
                                      📅 {new Date(issue.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {issuesByStatus[col.id].length === 0 && !snapshot.isDraggingOver && (
                            <div className="text-center py-8 text-gray-300 text-xs">
                              Drop here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
                </div>
              </div>
            </DragDropContext>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}