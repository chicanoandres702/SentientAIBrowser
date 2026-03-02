// Feature: Task Queue | Trace: README.md
/*
 * [Parent Feature/Milestone] Task Queue
 * [Child Task/Issue] Firestore write operations
 * [Subtask] Sync task queue items to Firestore with batch support
 * [Upstream] Task queue state -> [Downstream] Firebase Firestore
 * [Law Check] 57 lines | Passed 100-Line Law
 */

import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@features/auth/firebase-config';
import { TaskItem } from '@features/tasks/types';
import { sanitizeForCloud } from '../../../../shared/safe-cloud.utils';

export const syncTaskToFirestore = async (task: TaskItem, userId: string) => {
  const taskRef = doc(db, 'task_queues', task.id);
  const payload = sanitizeForCloud({
    ...task,
    user_id: userId,
    server_timestamp: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  if (payload.startTime === undefined) delete payload.startTime;
  if (payload.completedTime === undefined) delete payload.completedTime;
  await setDoc(taskRef, payload);
};

export const updateTaskInFirestore = async (
  id: string,
  updates: Partial<TaskItem>
) => {
  const taskRef = doc(db, 'task_queues', id);
  await updateDoc(
    taskRef,
    sanitizeForCloud({
      ...updates,
      updated_at: serverTimestamp(),
    })
  );
};

export const removeTaskFromFirestore = async (id: string) => {
  const taskRef = doc(db, 'task_queues', id);
  await deleteDoc(taskRef);
};

export const batchUpdateTasks = async (
  updates: Array<{ id: string; changes: Partial<TaskItem> }>
) => {
  const batch = writeBatch(db);
  for (const { id, changes } of updates) {
    batch.update(
      doc(db, 'task_queues', id),
      sanitizeForCloud({ ...changes, updated_at: serverTimestamp() })
    );
  }
  await batch.commit();
};

