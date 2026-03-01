// Feature: Missions | Why: Auto-execute tasks from active missions
import { auth, db } from '../features/auth/firebase-config';
import { doc, onSnapshot, updateDoc, collection, query, where, getDoc } from 'firebase/firestore';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';

interface TaskExecutorContext {
    webViewRef: React.RefObject<HeadlessWebViewRef>;
    setStatusMessage: (m: string) => void;
    setActivePrompt: (p: string) => void;
    setActiveUrl?: (url: string) => void;
    updateTask: (id: string, status: any, details?: string) => Promise<void>;
    remoteActions?: { executeAction: (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: { role?: string; name?: string; text?: string }) => Promise<void> };
}

interface MissionTask {
    id: string;
    title: string;
    action: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    targetId?: string;
    value?: string;
    explanation?: string;
}

/**
 * Listens to active missions and auto-executes their tasks
 * This bridges the gap between mission creation and task execution
 */
export class MissionTaskExecutor {
    private unsubscribe: (() => void) | null = null;
    private currentlyExecuting: string | null = null;
    private ctx: TaskExecutorContext | null = null;

    start(context: TaskExecutorContext) {
        if (this.unsubscribe || !auth.currentUser) return;
        
        this.ctx = context;
        console.log('[MissionTaskExecutor] Starting mission task execution listener...');

        // Listen to all active missions
        const q = query(
            collection(db, 'missions'),
            where('userId', '==', auth.currentUser.uid),
            where('status', '==', 'active')
        );

        this.unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.forEach(async (docSnap) => {
                const mission = docSnap.data();
                const missionId = docSnap.id;

                if (!mission.tasks || mission.tasks.length === 0) return;

                // Find the current task to execute
                const currentTask = this.getCurrentTaskForMission(mission.tasks);
                
                if (currentTask && !this.currentlyExecuting) {
                    await this.executeTask(missionId, currentTask, mission.goal);
                }
            });
        });
    }

    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.currentlyExecuting = null;
        console.log('[MissionTaskExecutor] Stopped');
    }

    private getCurrentTaskForMission(tasks: MissionTask[]): MissionTask | null {
        // First, look for in_progress task
        const inProgress = tasks.find(t => t.status === 'in_progress');
        if (inProgress) return inProgress;

        // Otherwise, get first pending task
        return tasks.find(t => t.status === 'pending') || null;
    }

    private async executeTask(missionId: string, task: MissionTask, missionGoal: string) {
        if (!this.ctx) return;

        try {
            this.currentlyExecuting = task.id;
            this.ctx.setStatusMessage(`Executing: ${task.title}`);
            this.ctx.setActivePrompt(missionGoal);

            // Update task status to in_progress
            const missionRef = doc(db, 'missions', missionId);
            await updateDoc(missionRef, {
                tasks: await this.updateTaskStatus(missionId, task.id, 'in_progress'),
                lastAction: `Executing: ${task.title}`,
                updated_at: new Date().toISOString()
            });

            // Execute the action based on task type
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

            // Mark task as completed
            await updateDoc(missionRef, {
                tasks: await this.updateTaskStatus(missionId, task.id, 'completed'),
                lastAction: `Completed: ${task.title}`,
                updated_at: new Date().toISOString()
            });

            this.ctx.setStatusMessage(`Completed: ${task.title}`);

        } catch (e) {
            console.error(`[MissionTaskExecutor] Task execution failed:`, e);
            const missionRef = doc(db, 'missions', missionId);
            await updateDoc(missionRef, {
                tasks: await this.updateTaskStatus(missionId, task.id, 'failed'),
                lastAction: `Failed: ${task.title}`,
                updated_at: new Date().toISOString()
            });
        } finally {
            this.currentlyExecuting = null;
        }
    }

    private async updateTaskStatus(missionId: string, taskId: string, status: string): Promise<MissionTask[]> {
        const missionRef = doc(db, 'missions', missionId);
        const snap = await getDoc(missionRef);
        if (!snap.exists()) return [];

        const tasks = snap.data()?.tasks || [];
        return tasks.map((t: MissionTask) => 
            t.id === taskId ? { ...t, status } : t
        );
    }
}

// Singleton instance
export const missionTaskExecutor = new MissionTaskExecutor();
