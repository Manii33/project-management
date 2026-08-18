'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { Issue, IssueStatus } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const COLUMNS: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-50' },
  { id: 'DONE', label: 'Done', color: 'bg-green-50' },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export default function KanbanPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [dragError, setDragError] = useState('');

  // Fetch all issues
  const { data, isLoading, error } = useQuery({
    queryKey: ['issues-kanban', projectId],
    queryFn: async () => {
      const res = await api.get<{ data: Issue[] }>(`/projects/${projectId}/issues?limit=100`);
      return res.data.data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) =>
      api.put(`/projects/${projectId}/issues/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues-kanban', projectId] });
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] });
      setDragError('');
    },
    onError: () => {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['issues-kanban', projectId] });
      setDragError('Failed to update issue status. Please try again.');
    },
  });

  // Group issues by status
  const issuesByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = data?.filter((i) => i.status === col.id) || [];
      return acc;
    },
    {} as Record<IssueStatus, Issue[]>,
  );

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as IssueStatus;

    // Optimistic update
    queryClient.setQueryData(['issues-kanban', projectId], (old: Issue[] | undefined) => {
      if (!old) return old;
      return old.map((issue) =>
        issue.id === draggableId ? { ...issue, status: newStatus } : issue,
      );
    });

    updateStatusMutation.mutate({ id: draggableId, status: newStatus });
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Kanban Board</h1>
            {dragError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                {dragError}
              </div>
            )}
          </div>

          {isLoading && <LoadingSpinner />}
          {error && <ErrorMessage message="Failed to load issues" />}

          {data && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-4 gap-4 h-full">
                {COLUMNS.map((col) => (
                  <div key={col.id} className="flex flex-col">
                    {/* Column Header */}
                    <div className={`rounded-t-xl px-4 py-3 ${col.color} border border-b-0`}>
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-700 text-sm">{col.label}</h2>
                        <span className="bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full border">
                          {issuesByStatus[col.id].length}
                        </span>
                      </div>
                    </div>

                    {/* Droppable Column */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 min-h-64 p-2 border rounded-b-xl transition-colors ${
                            snapshot.isDraggingOver ? `${col.color} border-blue-300` : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {issuesByStatus[col.id].map((issue, index) => (
                            <Draggable key={issue.id} draggableId={issue.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white border rounded-lg p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
                                  }`}
                                >
                                  <p className="text-sm font-medium text-gray-800 mb-2">{issue.title}</p>
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
                                    <p className="text-xs text-gray-400 mt-1">
                                      Due: {new Date(issue.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}