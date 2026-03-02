// Feature: Missions | Trace: README.md
/*
 * [Parent Feature/Milestone] Missions
 * [Child Task/Issue] Task executor orchestration
 * [Subtask] Orchestrate mission task execution with listener
 * [Upstream] Firestore -> [Downstream] Task action handlers
 * [Law Check] 90 lines | Passed 100-Line Law
 */

import { auth, db } from '@features/auth/firebase-config';
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { HeadlessWebViewRef } from '@features/browser';
import { MissionTask, getCurrentTaskForMission, updateMissionTaskStatus } from './mission.task-utils.service';
import { executeTaskAction, handleTaskError } from './mission.task-actions.service';

interface TaskExecutorContext {
  webViewRef: React.RefObject<HeadlessWebViewRef>;
  setStatusMessage: (m: string) => void;
  setActivePrompt: (p: string) => void;
  setActiveUrl?: (url: string) => void;
  updateTask: (id: string, status: unknown, details?: string) => Promise<void>;
  remoteActions?: { executeAction: (action: 'click' | 'type', id?: string, val?: string) => Promise<void> };
}

export class MissionTaskExecutor {
  private unsubscribe: (() => void) | null = null;
  private currentlyExecuting: string | null = null;
  private ctx: TaskExecutorContext | null = null;

  start(context: TaskExecutorContext) {
    this.ctx = context;
    if (this.unsubscribe || !auth.currentUser) return;
    const q = query(collection(db, 'missions'), where('userId', '==', auth.currentUser.uid), where('status', '==', 'active'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach(async (docSnap) => {
        const mission = docSnap.data();
        if (!mission.tasks?.length) return;
        const currentTask = getCurrentTaskForMission(mission.tasks);
        if (currentTask && !this.currentlyExecuting) {
          await this.executeTask(docSnap.id, currentTask, mission.goal);
        }
      });
    });
  }

  updateContext(context: TaskExecutorContext) {
    this.ctx = context;
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.currentlyExecuting = null;
  }

  private async executeTask(missionId: string, task: MissionTask, missionGoal: string) {
    if (!this.ctx) return;
    try {
      const missionRef = doc(db, 'missions', missionId);
      await updateDoc(missionRef, { executingAgent: 'frontend', updated_at: new Date().toISOString() });
      this.currentlyExecuting = task.id;
      this.ctx.setStatusMessage(`Executing: ${task.title}`);
      this.ctx.setActivePrompt(missionGoal);
      const inProgressTasks = await updateMissionTaskStatus(missionId, task.id, 'in_progress');
      await updateDoc(missionRef, {
        tasks: inProgressTasks,
        lastAction: `Executing: ${task.title}`,
        updated_at: new Date().toISOString(),
      });
      const result = await executeTaskAction(this.ctx as unknown as Parameters<typeof executeTaskAction>[0], task, missionId);
      if (result === 'done') {
        this.currentlyExecuting = null;
      }
    } catch (e) {
      console.error('[MissionTaskExecutor] Task execution failed:', e);
      await handleTaskError(missionId, task);
    } finally {
      this.currentlyExecuting = null;
    }
  }
}

export const missionTaskExecutor = new MissionTaskExecutor();
