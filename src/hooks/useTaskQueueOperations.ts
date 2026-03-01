// Feature: Tasks | Trace: src/hooks/useTaskQueueOperations.ts
import { useCallback } from 'react';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore } from '../utils/task-sync-service';

export const useTaskQueueOperations = (isAuthenticated: boolean) => {
  const addTask = useCallback(async (title: string, missionId?: string, workflowId?: string, workspaceId?: string): Promise<TaskItem | undefined> => {
    if (!isAuthenticated) return;
    const newTask: TaskItem = {
      id: Math.random().toString(36).slice(2, 11),
      title: title.trim(),
      status: 'pending' as TaskStatus,
      progress: 0,
      timestamp: Date.now(),
      missionId,
      workflowId,
      workspaceId,
    };
    await syncTaskToFirestore(newTask);
    return newTask;
  }, [isAuthenticated]);

  const updateTask = useCallback(async (id: string, status: TaskStatus, details?: string, progress?: number, subActions?: TaskItem['subActions']) => {
    if (!isAuthenticated) return;
    await updateTaskInFirestore(id, { status, details, progress, subActions, completedTime: status === 'completed' ? Date.now() : undefined });
  }, [isAuthenticated]);

  const removeTask = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    await removeTaskFromFirestore(id);
  }, [isAuthenticated]);

  const clearTasks = useCallback(async (tasks: TaskItem[]) => {
    if (!isAuthenticated) return;
    await Promise.all(tasks.map(t => removeTaskFromFirestore(t.id)));
  }, [isAuthenticated]);

  return { addTask, updateTask, removeTask, clearTasks };
};
