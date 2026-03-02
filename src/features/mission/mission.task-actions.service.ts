// Feature: Missions | Trace: README.md
/*
 * [Parent Feature/Milestone] Missions
 * [Child Task/Issue] Task action handlers
 * [Subtask] Handle execution of individual task actions (navigate, click, type, wait)
 * [Upstream] Task queue -> [Downstream] Browser actions
 * [Law Check] 73 lines | Passed 100-Line Law
 */

import { db } from '@features/auth/firebase-config';
import { doc, updateDoc } from 'firebase/firestore';
import type { MissionTask } from './mission.task-utils.service';
import { updateMissionTaskStatus } from './mission.task-utils.service';

interface ActionContext {
  webViewRef: React.RefObject<{ executeAction: (action: string, targetId?: string, value?: string) => Promise<void> }>;
  setStatusMessage: (m: string) => void;
  setActiveUrl?: (url: string) => void;
  remoteActions?: {
    executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string) => Promise<void>;
  };
}

export const executeTaskAction = async (
  context: ActionContext,
  task: MissionTask,
  missionId: string
) => {
  const missionRef = doc(db, 'missions', missionId);

  if (task.action === 'navigate' && task.value) {
    context.setActiveUrl?.(task.value);
  } else if (task.action === 'click' && task.targetId) {
    if (context.remoteActions) {
      await context.remoteActions.executeAction('click', task.targetId);
    } else {
      await context.webViewRef.current?.executeAction('click', task.targetId);
    }
  } else if (task.action === 'type' && task.targetId && task.value) {
    if (context.remoteActions) {
      await context.remoteActions.executeAction('type', task.targetId, task.value);
    } else {
      await context.webViewRef.current?.executeAction('type', task.targetId, task.value);
    }
  } else if (task.action === 'wait') {
    await new Promise((r) => setTimeout(r, 2000));
  } else if (task.action === 'done') {
    await updateDoc(missionRef, {
      status: 'completed',
      progress: 100,
      lastAction: 'Mission Completed',
    });
    return 'done';
  }

  const completedTasks = await updateMissionTaskStatus(missionId, task.id, 'completed');
  await updateDoc(missionRef, {
    tasks: completedTasks,
    lastAction: `Completed: ${task.title}`,
    updated_at: new Date().toISOString(),
  });
  context.setStatusMessage(`Completed: ${task.title}`);
  return 'completed';
};

export const handleTaskError = async (missionId: string, task: MissionTask) => {
  const missionRef = doc(db, 'missions', missionId);
  const failedTasks = await updateMissionTaskStatus(missionId, task.id, 'failed');
  await updateDoc(missionRef, {
    tasks: failedTasks,
    lastAction: `Failed: ${task.title}`,
    updated_at: new Date().toISOString(),
  });
};
