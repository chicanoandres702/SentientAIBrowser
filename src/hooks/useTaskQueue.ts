// Feature: Tasks | Trace: README.md
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore, hydrateTasksFromFirestore } from '../utils/task-sync-service';
import { recalcMissionProgress } from './task-queue-progress';

export const useTaskQueue = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);

    const deriveProgress = useCallback((status: TaskStatus, subActions?: TaskItem['subActions'], current: number = 0): number => {
        if (!subActions || subActions.length === 0) {
            if (status === 'completed') return 100;
            if (status === 'in_progress') return Math.max(current, 50);
            if (status === 'failed') return 0;
            return 0;
        }

        const total = subActions.length;
        const completed = subActions.filter(sa => sa.status === 'completed').length;
        const inProgress = subActions.filter(sa => sa.status === 'in_progress').length;
        const base = Math.round(((completed + inProgress * 0.5) / total) * 100);

        if (status === 'completed') return 100;
        if (status === 'in_progress') return Math.max(base, 5);
        if (status === 'failed') return base;
        return base;
    }, []);

    const advanceSubActions = useCallback((
        subActions: TaskItem['subActions'],
        nextStatus: TaskStatus,
        details?: string,
    ): TaskItem['subActions'] => {
        if (!subActions || subActions.length === 0) return subActions;
        const updated = subActions.map(sa => ({ ...sa }));

        if (nextStatus === 'in_progress') {
            if (!updated.some(sa => sa.status === 'in_progress' || sa.status === 'completed')) {
                const firstPending = updated.find(sa => sa.status === 'pending');
                if (firstPending) firstPending.status = 'in_progress';
            }
            return updated;
        }

        if (nextStatus === 'completed') {
            const doneMatch = (details || '').match(/^Done:\s*([a-z_]+)/i);
            const doneAction = doneMatch?.[1]?.toLowerCase();
            const byAction = doneAction
                ? updated.find(sa => sa.status !== 'completed' && sa.action.toLowerCase() === doneAction)
                : undefined;
            const target = byAction || updated.find(sa => sa.status === 'in_progress') || updated.find(sa => sa.status === 'pending');
            if (target) target.status = 'completed';
            return updated;
        }

        if (nextStatus === 'failed') {
            const target = updated.find(sa => sa.status === 'in_progress') || updated.find(sa => sa.status === 'pending');
            if (target) target.status = 'failed';
            return updated;
        }

        return updated;
    }, []);

    useEffect(() => {
        const hydrate = async () => {
            if (!auth.currentUser) return;
            try {
                const loadedTasks = await hydrateTasksFromFirestore(auth.currentUser.uid);
                if (loadedTasks.length > 0) setTasks(loadedTasks);
            } catch (e) { console.error("Hydration failed:", e); }
        };
        hydrate();
    }, [auth.currentUser]);

    const addTask = useCallback(async (title: string, status: TaskStatus = 'pending', details?: string, extra?: Partial<TaskItem>) => {
        const id = extra?.id || (Date.now().toString() + Math.random().toString());
        const now = Date.now();
        const newTask: TaskItem = { 
            id, 
            title, 
            status, 
            timestamp: now, 
            details: details || "",
            progress: status === 'completed' ? 100 : status === 'in_progress' ? 0 : 0,
            startTime: status === 'pending' ? undefined : now,
            estimatedDuration: 60000,
            ...extra,
        };
        setTasks(prev => [...prev, newTask]);
        try {
            await syncTaskToFirestore(newTask, auth.currentUser?.uid || 'anonymous');
        } catch (e) { console.error("Task add sync failed:", e); }
        return id;
    }, []);

    const updateTask = useCallback(async (id: string, status: TaskStatus, details?: string) => {
        let persistedStatus: TaskStatus = status;
        let persistedDetails: string = details || '';
        setTasks(prev => {
            const now = Date.now();
            let updated = prev.map(t => {
                if (t.id !== id) return t;
                const nextSubActions = advanceSubActions(t.subActions, status, details || t.details);
                const subActionComplete = !!nextSubActions?.length && nextSubActions.every(sa => sa.status === 'completed');
                const normalizedStatus: TaskStatus = (status === 'completed' && !subActionComplete) ? 'in_progress' : status;
                const completedTime = normalizedStatus === 'completed' ? now : t.completedTime;
                const progress = deriveProgress(normalizedStatus, nextSubActions, t.progress);
                // Fix: set startTime when promoting pending → in_progress
                const startTime = (normalizedStatus === 'in_progress' && !t.startTime) ? now : t.startTime;
                persistedStatus = normalizedStatus;
                persistedDetails = details || t.details || '';
                return { ...t, status: normalizedStatus, details: details || t.details, completedTime, progress, startTime, subActions: nextSubActions };
            });

            const task = updated.find(t => t.id === id);
            if (task?.missionId) {
                // Auto-advance: when a task completes, promote next pending sibling
                if (task.status === 'completed' || task.status === 'failed') {
                    const nextPending = updated.find(t =>
                        !t.isMission && t.missionId === task.missionId
                        && t.status === 'pending' && t.id !== id
                    );
                    if (nextPending) {
                        const nextSubActions = advanceSubActions(nextPending.subActions, 'in_progress', `Executing: ${nextPending.title}`);
                        const nextProgress = deriveProgress('in_progress', nextSubActions, nextPending.progress);
                        updated = updated.map(t =>
                            t.id === nextPending.id
                                ? { ...t, status: 'in_progress' as TaskStatus, startTime: now, details: `Executing: ${t.title}`, progress: nextProgress, subActions: nextSubActions }
                                : t
                        );
                        updateTaskInFirestore(nextPending.id, { status: 'in_progress', details: `Executing: ${nextPending.title}`, progress: nextProgress }).catch(() => {});
                    }
                }
                updated = recalcMissionProgress(updated, task.missionId);
                const mission = updated.find(t => t.id === task.missionId);
                if (mission) {
                    const done = updated.filter(t => t.missionId === mission.id && !t.isMission && t.status === 'completed').length;
                    const total = updated.filter(t => t.missionId === mission.id && !t.isMission).length;
                    updateTaskInFirestore(mission.id, { status: mission.status, progress: mission.progress, details: `${done}/${total} tasks done` }).catch(() => {});
                }
            }

            return updated;
        });
        try {
            await updateTaskInFirestore(id, { status: persistedStatus, details: persistedDetails });
        } catch (e) { console.error("Task update sync failed:", e); }
    }, [advanceSubActions, deriveProgress, recalcMissionProgress]);

    const removeTask = useCallback(async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            await removeTaskFromFirestore(id);
        } catch (e) { console.error("Task remove sync failed:", e); }
    }, []);

    const clearTasks = useCallback(async () => {
        const currentTasks = tasks;
        setTasks([]);
        try {
            for (const t of currentTasks) await removeTaskFromFirestore(t.id);
        } catch (e) { console.error("Task clear sync failed:", e); }
    }, [tasks]);

    return { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask: () => {} };
};
