// Feature: Tasks | Trace: src/features/task-queue/useTaskQueueState.ts
/*
 * [Reusable Hook] Task state management and mutations
 * [Upstream] Firestore → [Downstream] Task operations
 * [Extracted From] useTaskQueue.ts to reduce complexity
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { TaskItem, TaskStatus } from '../tasks/types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../auth/firebase-config';
import { listenToTasks, syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore } from '../../utils/task-sync-service';
import { areSubActionsEqual, isTaskEquivalent } from '../../hooks/task-queue.utils';

export const useTaskQueueState = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const taskUnsubRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, (user) => {
      taskUnsubRef.current?.();
      if (!user) return;
      taskUnsubRef.current = listenToTasks(user.uid, (cloudTasks) => {
        setTasks((prev) => {
          const prevById = new Map(prev.map((t) => [t.id, t]));
          const merged = cloudTasks.map((ct) => {
            const prevTask = prevById.get(ct.id);
            return prevTask && isTaskEquivalent(prevTask, ct) ? prevTask : ct;
          });
          const sameOrderAndRefs = prev.length === merged.length && prev.every((t, i) => t === merged[i]);
          return sameOrderAndRefs ? prev : merged;
        });
      });
    });
    return () => { authUnsub(); taskUnsubRef.current?.(); };
  }, []);

  return { tasks, setTasks };
};
