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
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore, listenToTasks } from '../../utils/task-sync-service';

interface TaskPersistenceHookRef {
    taskUnsubRef: React.MutableRefObject<(() => void) | undefined>;
}

/** Hook for Firestore sync and persistence */
export const useTaskPersistence = (
    onTasksUpdate: (tasks: TaskItem[]) => void,
    isTaskEquivalent: (prev: TaskItem, next: TaskItem) => boolean,
) => {
    const setupAuthListener = useCallback((taskUnsubRef: React.MutableRefObject<(() => void) | undefined>) => {
        const authUnsub = onAuthStateChanged(auth, (user) => {
            taskUnsubRef.current?.();
            if (!user) return;
            taskUnsubRef.current = listenToTasks(user.uid, (cloudTasks) => {
                onTasksUpdate((prev) => {
                    const prevById = new Map(prev.map(t => [t.id, t]));
                    const merged = cloudTasks.map(ct => {
                        const prevTask = prevById.get(ct.id);
                        return prevTask && isTaskEquivalent(prevTask, ct) ? prevTask : ct;
                    });
                    const sameOrderAndRefs = prev.length === merged.length && prev.every((t, i) => t === merged[i]);
                    return sameOrderAndRefs ? prev : merged;
                });
            });
        });
        return () => { authUnsub(); taskUnsubRef.current?.(); };
    }, [onTasksUpdate, isTaskEquivalent]);

    const syncAdd = useCallback(async (task: TaskItem) => {
        try {
            await syncTaskToFirestore(task, auth.currentUser?.uid || 'anonymous');
        } catch (e) { console.error("Task add sync failed:", e); }
    }, []);

    const syncUpdate = useCallback(async (id: string, status: TaskStatus, details: string) => {
        try {
            await updateTaskInFirestore(id, { status, details });
        } catch (e) { console.error("Task update sync failed:", e); }
    }, []);

    const syncRemove = useCallback(async (id: string) => {
        try {
            await removeTaskFromFirestore(id);
        } catch (e) { console.error("Task remove sync failed:", e); }
    }, []);

    return { setupAuthListener, syncAdd, syncUpdate, syncRemove };
};
