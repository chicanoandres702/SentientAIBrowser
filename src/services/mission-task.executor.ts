// Feature: Missions | Trace: src/services/mission-task.executor.ts
import { auth, db } from '../features/auth/firebase-config';
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore';
import { HeadlessWebViewRef } from '@features/browser';
import { MissionTask, getCurrentTaskForMission, updateMissionTaskStatus } from './mission-task.utils';

interface TaskExecutorContext {
  webViewRef: React.RefObject<HeadlessWebViewRef>;
  setStatusMessage: (m: string) => void;
  setActivePrompt: (p: string) => void;
  setActiveUrl?: (url: string) => void;
  updateTask: (id: string, status: any, details?: string) => Promise<void>;
  remoteActions?: { executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string) => Promise<void> };
}

export class MissionTaskExecutor {
  private unsubscribe: (() => void) | null = null;
  private currentlyExecuting: string | null = null;
  private ctx: TaskExecutorContext | null = null;

  start(context: TaskExecutorContext) {
    this.ctx = context;
    if (this.unsubscribe || !auth.currentUser) return;
    console.log('[MissionTaskExecutor] Starting mission task execution listener...');
    const q = query(collection(db, 'missions'), where('userId', '==', auth.currentUser.uid), where('status', '==', 'active'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach(async (docSnap) => {
        const mission = docSnap.data();
        const missionId = docSnap.id;
        if (!mission.tasks || mission.tasks.length === 0) return;
        const currentTask = getCurrentTaskForMission(mission.tasks);
        if (currentTask && !this.currentlyExecuting) {
          await this.executeTask(missionId, currentTask, mission.goal);
        }
      });
    });
  }

  updateContext(context: TaskExecutorContext) {
    this.ctx = context;
  }

  stop() {
    if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
    this.currentlyExecuting = null;
    console.log('[MissionTaskExecutor] Stopped');
  }

  private async executeTask(missionId: string, task: MissionTask, missionGoal: string) {
    if (!this.ctx) return;
    try {
      const missionRef = doc(db, 'missions', missionId);
      await updateDoc(missionRef, { executingAgent: 'frontend', updated_at: new Date().toISOString() });
      this.currentlyExecuting = task.id;
      this.ctx.setStatusMessage(`Executing: ${task.title}`);
      this.ctx.setActivePrompt(missionGoal);
      await updateDoc(missionRef, {
        tasks: await updateMissionTaskStatus(missionId, task.id, 'in_progress'),
        lastAction: `Executing: ${task.title}`,
        updated_at: new Date().toISOString()
      });
      if (task.action === 'navigate' && task.value) {
        this.ctx.setActiveUrl?.(task.value);
      } else if (task.action === 'click' && task.targetId) {
        if (this.ctx.remoteActions) {
          await this.ctx.remoteActions.executeAction('click', task.targetId);
        } else {
          this.ctx.webViewRef.current?.executeAction('click', task.targetId);
        }
      } else if (task.action === 'type' && task.targetId && task.value) {
        if (this.ctx.remoteActions) {
          await this.ctx.remoteActions.executeAction('type', task.targetId, task.value);
        } else {
          this.ctx.webViewRef.current?.executeAction('type', task.targetId, task.value);
        }
      } else if (task.action === 'wait') {
        await new Promise(r => setTimeout(r, 2000));
      } else if (task.action === 'done') {
        this.ctx.setStatusMessage('Mission Complete');
        await updateDoc(missionRef, {
          status: 'completed',
          progress: 100,
          lastAction: 'Mission Completed Successfully'
        });
        this.currentlyExecuting = null;
        return;
      }
      await updateDoc(missionRef, {
        tasks: await updateMissionTaskStatus(missionId, task.id, 'completed'),
        lastAction: `Completed: ${task.title}`,
        updated_at: new Date().toISOString()
      });
      this.ctx.setStatusMessage(`Completed: ${task.title}`);
    } catch (e) {
      console.error(`[MissionTaskExecutor] Task execution failed:`, e);
      const missionRef = doc(db, 'missions', missionId);
      await updateDoc(missionRef, {
        tasks: await updateMissionTaskStatus(missionId, task.id, 'failed'),
        lastAction: `Failed: ${task.title}`,
        updated_at: new Date().toISOString()
      });
    } finally {
      this.currentlyExecuting = null;
    }
  }
}

// Singleton instance
export const missionTaskExecutor = new MissionTaskExecutor();
