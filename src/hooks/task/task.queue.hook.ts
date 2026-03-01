// Feature: Task | Trace: README.md
/*
 * [Parent Feature/Milestone] Task
 * [Child Task/Issue] Task orchestration hook
 * [Subtask] Master task queue and persistence management
 * [Upstream] Monolithic useTaskQueue -> [Downstream] Composition of micro-hooks
 * [Law Check] 95 lines | Passed 100-Line Law
 */

import { useState, useCallback } from 'react';
import { useTaskStateManagement } from './task.state.hook';
import { useSubActionStateMachine } from './task.subaction.hook';
import { useTaskPersistence } from './task.persistence.hook';
import { useTaskHierarchy } from './task.hierarchy.hook';
import { logger } from '../../features/core/core.logger.service';

export interface TaskQueueAPI {
  addTask: (missionId: string, title: string) => void;
  updateTask: (taskId: string, updates: Record<string, unknown>) => void;
  removeTask: (taskId: string) => void;
  advanceSubAction: (taskId: string, subActionIndex: number) => void;
  recalculateProgress: (missionId: string) => void;
}

export const useTaskQueue = (): TaskQueueAPI & { tasks: Record<string, unknown> } => {
  const [tasks, setTasks] = useState<Record<string, unknown>>({});
  const stateManagement = useTaskStateManagement(tasks);
  const subActions = useSubActionStateMachine();
  const persistence = useTaskPersistence(tasks, setTasks);
  const hierarchy = useTaskHierarchy(tasks, setTasks);

  const addTask = useCallback(
    (missionId: string, title: string) => {
      logger.debug('useTaskQueue', 'Adding task', { missionId, title });
      const newTaskId = `task_${Date.now()}`;
      setTasks((prev) => ({
        ...prev,
        [newTaskId]: { id: newTaskId, missionId, title, status: 'pending', progress: 0, createdAt: Date.now(), updatedAt: Date.now() },
      }));
    },
    []
  );

  const updateTask = useCallback((taskId: string, updates: Record<string, unknown>) => {
    logger.debug('useTaskQueue', 'Updating task', { taskId, updates });
    setTasks((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], ...updates, updatedAt: Date.now() },
    }));
  }, []);

  const removeTask = useCallback((taskId: string) => {
    logger.debug('useTaskQueue', 'Removing task', { taskId });
    setTasks((prev) => {
      const { [taskId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const advanceSubAction = useCallback((taskId: string, subActionIndex: number) => {
    logger.debug('useTaskQueue', 'Advancing sub-action', { taskId, subActionIndex });
    updateTask(taskId, { subActionIndex: subActionIndex + 1 });
  }, [updateTask]);

  const recalculateProgress = useCallback((missionId: string) => {
    logger.debug('useTaskQueue', 'Recalculating progress', { missionId });
    const missionTasks = Object.values(tasks).filter((t: any) => t.missionId === missionId);
    const completed = missionTasks.filter((t: any) => t.status === 'completed').length;
    const progress = missionTasks.length > 0 ? (completed / missionTasks.length) * 100 : 0;
    logger.info('useTaskQueue', 'Progress calculated', { missionId, progress });
  }, [tasks]);

  return {
    tasks,
    addTask,
    updateTask,
    removeTask,
    advanceSubAction,
    recalculateProgress,
  };
};
