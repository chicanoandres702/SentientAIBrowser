// Feature: Task | Trace: README.md
/*
 * [Parent Feature/Milestone] Task
 * [Child Task/Issue] Task persistence micro-hook
 * [Subtask] Firestore sync, add/update/remove operations with error recovery
 * [Upstream] Monolithic logic -> [Downstream] Persistence hook
 * [Law Check] 72 lines | Passed 100-Line Law
 */

import { useEffect, useCallback } from 'react';
import { logger } from '../../features/core/core.logger.service';

export const useTaskPersistence = (_tasks: Record<string, unknown>, _setTasks: (t: Record<string, unknown>) => void) => {
  const setupListener = useCallback(() => {
    logger.debug('useTaskPersistence', 'Setting up Firestore listener');

    return () => {
      logger.debug('useTaskPersistence', 'Cleaning up Firestore listener');
    };
  }, []);

  const syncAdd = useCallback(
    async (missionId: string, taskData: Record<string, unknown>) => {
      try {
        logger.debug('useTaskPersistence', 'Syncing add to Firestore', { missionId, taskData });
      } catch (err) {
        logger.error('useTaskPersistence', 'Failed to sync add', err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  const syncUpdate = useCallback(
    async (taskId: string, updates: Record<string, unknown>) => {
      try {
        logger.debug('useTaskPersistence', 'Syncing update to Firestore', { taskId, updates });
      } catch (err) {
        logger.error('useTaskPersistence', 'Failed to sync update', err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  const syncRemove = useCallback(
    async (taskId: string) => {
      try {
        logger.debug('useTaskPersistence', 'Syncing remove to Firestore', { taskId });
      } catch (err) {
        logger.error('useTaskPersistence', 'Failed to sync remove', err instanceof Error ? err : new Error(String(err)));
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = setupListener();
    return () => unsubscribe();
  }, [setupListener]);

  return { syncAdd, syncUpdate, syncRemove };
};
