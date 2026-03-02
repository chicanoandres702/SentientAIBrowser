// Feature: Task Queue | Trace: README.md
/*
 * [Parent Feature/Milestone] Task Queue
 * [Child Task/Issue] Firestore read operations
 * [Subtask] Query and listen to task queues from Firestore
 * [Upstream] Firebase Firestore -> [Downstream] Task queue state
 * [Law Check] 46 lines | Passed 100-Line Law
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '@features/auth/firebase-config';
import { TaskItem } from '@features/tasks/types';

export const listenToTasks = (
  userId: string,
  callback: (tasks: TaskItem[]) => void
) => {
  const q = query(
    collection(db, 'task_queues'),
    where('user_id', '==', userId),
    orderBy('timestamp', 'asc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const tasks: TaskItem[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      tasks.push({
        id: d.id,
        title: d.title,
        status: d.status,
        timestamp: d.timestamp,
        details: d.details,
        category: d.category,
        progress: d.progress,
        missionId: d.missionId,
        runId: d.runId,
        tabId: d.tabId,
        workflowId: d.workflowId,
        workspaceId: d.workspaceId,
        order: d.order,
        source: d.source,
        isMission: d.isMission,
        subActions: d.subActions,
        startTime: d.startTime,
        completedTime: d.completedTime,
        estimatedDuration: d.estimatedDuration,
      } as TaskItem);
    });
    callback(tasks);
  });
};

export const hydrateTasksFromFirestore = async (userId: string) => {
  const q = query(
    collection(db, 'task_queues'),
    where('user_id', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(10)
  );
  const querySnapshot = await getDocs(q);
  const loadedTasks: TaskItem[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    loadedTasks.push({
      id: data.id,
      title: data.title,
      status: data.status,
      timestamp: data.timestamp,
      details: data.details,
      category: data.category,
      progress: data.progress,
      missionId: data.missionId,
      runId: data.runId,
      tabId: data.tabId,
      workflowId: data.workflowId,
      workspaceId: data.workspaceId,
      order: data.order,
      source: data.source,
      isMission: data.isMission,
      subActions: data.subActions,
      startTime: data.startTime,
      completedTime: data.completedTime,
      estimatedDuration: data.estimatedDuration,
    } as TaskItem);
  });
  return loadedTasks.reverse();
};
