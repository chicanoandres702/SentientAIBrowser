// Feature: Tasks | Trace: README.md
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore, hydrateTasksFromFirestore } from '../utils/task-sync-service';
import { recalcMissionProgress } from './task-queue-progress';

export const useTaskQueue = () => {
    const [tasks, setTasks] = useState<TaskItem[]>([]);

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
        setTasks(prev => {
            const now = Date.now();
            let updated = prev.map(t => {
                if (t.id !== id) return t;
                const completedTime = status === 'completed' ? now : t.completedTime;
                const progress = status === 'completed' ? 100 : status === 'failed' ? 0 : t.progress;
                // Fix: set startTime when promoting pending → in_progress
                const startTime = (status === 'in_progress' && !t.startTime) ? now : t.startTime;
                return { ...t, status, details: details || t.details, completedTime, progress, startTime };
            });

            const task = updated.find(t => t.id === id);
            if (task?.missionId) {
                // Auto-advance: when a task completes, promote next pending sibling
                if (status === 'completed' || status === 'failed') {
                    const nextPending = updated.find(t =>
                        !t.isMission && t.missionId === task.missionId
                        && t.status === 'pending' && t.id !== id
                    );
                    if (nextPending) {
                        updated = updated.map(t =>
                            t.id === nextPending.id
                                ? { ...t, status: 'in_progress' as TaskStatus, startTime: now, details: `Executing: ${t.title}` }
                                : t
                        );
                        updateTaskInFirestore(nextPending.id, { status: 'in_progress', details: `Executing: ${nextPending.title}` }).catch(() => {});
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
            await updateTaskInFirestore(id, { status, details: details || "" });
        } catch (e) { console.error("Task update sync failed:", e); }
    }, [recalcMissionProgress]);

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
