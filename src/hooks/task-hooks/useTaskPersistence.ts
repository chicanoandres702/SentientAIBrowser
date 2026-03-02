// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] useTaskQueue refactor
 * [Subtask] Firestore sync and persistence logic
 * [Upstream] TaskItem mutations -> [Downstream] Firestore writes
 * [Law Check] 72 lines | Passed 100-Line Law
 */
import { useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../../features/tasks/types';
import {
  syncTaskToFirestore,
  updateTaskInFirestore,
  removeTaskFromFirestore,
} from '@features/task-queue/services/task-queue.sync.service';
import { listenToTasks } from '@features/task-queue/services/task-queue.read.service';

/** Hook for Firestore sync and persistence */
export const useTaskPersistence = (
    onTasksUpdate: React.Dispatch<React.SetStateAction<TaskItem[]>>,
    isTaskEquivalent: (prev: TaskItem, next: TaskItem) => boolean,
) => {
    const setupAuthListener = useCallback((taskUnsubRef: React.MutableRefObject<(() => void) | undefined>) => {
        const authUnsub = onAuthStateChanged(auth, (user) => {
            taskUnsubRef.current?.();
            if (!user) { console.debug('[TaskPersist] 🔓 auth signed out — tearing down task listener'); return; }
            console.log(`[TaskPersist] 🔐 auth signed in uid=${user.uid} — opening task listener`);
            taskUnsubRef.current = listenToTasks(user.uid, (cloudTasks: TaskItem[]) => {
                console.debug(`[TaskPersist] 📥 snapshot received cloudTasks=${cloudTasks.length}`);
                onTasksUpdate((prev: TaskItem[]) => {
                    // Why: guard — skip empty snapshots to prevent locally-added tasks
                    // (write not yet round-tripped) from being wiped by the echo
                    if (cloudTasks.length === 0) { console.debug('[TaskPersist] ⏸️  skip empty snapshot — keeping prev'); return prev; }
                    const prevById = new Map(prev.map((t: TaskItem) => [t.id, t]));
                    const cloudIds = new Set(cloudTasks.map((t: TaskItem) => t.id));
                    // Why: union merge — cloud is authoritative; also keep local-only tasks
                    // that haven't synced yet so they aren't dropped by a snapshot echo
                    const merged: TaskItem[] = [
                        ...cloudTasks.map((ct: TaskItem) => {
                            const prevTask = prevById.get(ct.id);
                            return prevTask && isTaskEquivalent(prevTask, ct) ? prevTask : ct;
                        }),
                        ...prev.filter((t: TaskItem) => !cloudIds.has(t.id)),
                    ];
                    const sameOrderAndRefs = prev.length === merged.length && prev.every((t: TaskItem, i: number) => t === merged[i]);
                    if (!sameOrderAndRefs) console.log(`[TaskPersist] ♻️  merged prev=${prev.length} cloud=${cloudTasks.length} result=${merged.length}`);
                    return sameOrderAndRefs ? prev : merged;
                });
            });
        });
        return () => { authUnsub(); taskUnsubRef.current?.(); };
    }, [onTasksUpdate, isTaskEquivalent]);

    const syncAdd = useCallback(async (task: TaskItem) => {
        console.debug(`[TaskPersist] ➕ syncAdd id=${task.id} title=${task.title.substring(0, 40)}`);
        try {
            await syncTaskToFirestore(task, auth.currentUser?.uid || 'anonymous');
        } catch (e) { console.error('[TaskPersist] ❌ syncAdd failed:', e); }
    }, []);

    const syncUpdate = useCallback(async (id: string, status: TaskStatus, details: string) => {
        console.debug(`[TaskPersist] ✏️  syncUpdate id=${id} status=${status}`);
        try {
            await updateTaskInFirestore(id, { status, details });
        } catch (e) { console.error('[TaskPersist] ❌ syncUpdate failed:', e); }
    }, []);

    const syncRemove = useCallback(async (id: string) => {
        console.debug(`[TaskPersist] 🗑️  syncRemove id=${id}`);
        try {
            await removeTaskFromFirestore(id);
        } catch (e) { console.error('[TaskPersist] ❌ syncRemove failed:', e); }
    }, []);

    return { setupAuthListener, syncAdd, syncUpdate, syncRemove };
};
