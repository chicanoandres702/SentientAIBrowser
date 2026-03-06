// Feature: Tasks | Trace: src/features/task-queue/useTaskQueueState.ts
/*
 * [Reusable Hook] Task state management and mutations
 * [Upstream] Firestore → [Downstream] Task operations
 * [Extracted From] useTaskQueue.ts to reduce complexity
 */
import { useState, useRef, useEffect } from 'react';
import { TaskItem } from '../tasks/types';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../auth/firebase-config';
import {
  listenToTasks,
} from './services';
import { isTaskEquivalent } from '../../hooks/task-queue.utils';

export const useTaskQueueState = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const taskUnsubRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, (user) => {
      taskUnsubRef.current?.();
      if (!user) return;
      taskUnsubRef.current = listenToTasks(user.uid, (cloudTasks) => {
        setTasks((prev) => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const cloudArr = Array.isArray(cloudTasks) ? cloudTasks : [];
          const prevById = new Map(prevArr.map((t) => [t.id, t]));
          const merged = cloudArr.map((ct) => {
            const prevTask = prevById.get(ct.id);
            return prevTask && isTaskEquivalent(prevTask, ct) ? prevTask : ct;
          });
          const sameOrderAndRefs = prevArr.length === merged.length && prevArr.every((t, i) => t === merged[i]);
          return sameOrderAndRefs ? prevArr : merged;
        });
      });
    });
    return () => { authUnsub(); taskUnsubRef.current?.(); };
  }, []);

  return { tasks, setTasks };
};
