// Feature: Tasks | Trace: README.md
import { useState, useEffect, useCallback } from 'react';
import { auth } from '../features/auth/firebase-config';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { syncTaskToFirestore, updateTaskInFirestore, removeTaskFromFirestore, hydrateTasksFromFirestore } from '../utils/task-sync-service';

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

    /** Recalculate a mission task's progress from its child tasks */
    const recalcMissionProgress = useCallback((allTasks: TaskItem[], missionId: string): TaskItem[] => {
        const children = allTasks.filter(t => t.missionId === missionId && !t.isMission);
        if (children.length === 0) return allTasks;

        const completed = children.filter(t => t.status === 'completed').length;
        const failed = children.filter(t => t.status === 'failed').length;
        const total = children.length;
        const progress = Math.round((completed / total) * 100);

        // Determine mission status from children
        let missionStatus: TaskStatus = 'in_progress';
        if (completed === total) missionStatus = 'completed';
        else if (failed === total) missionStatus = 'failed';
        else if (children.some(t => t.status === 'in_progress')) missionStatus = 'in_progress';

        return allTasks.map(t => {
            if (t.id === missionId && t.isMission) {
                return { ...t, progress, status: missionStatus, completedTime: missionStatus === 'completed' ? Date.now() : t.completedTime };
            }
            return t;
        });
    }, []);

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
            let updated = prev.map(t => {
                if (t.id !== id) return t;
                const completedTime = status === 'completed' ? Date.now() : t.completedTime;
                const progress = status === 'completed' ? 100 : status === 'failed' ? 0 : t.progress;
                return { ...t, status, details: details || t.details, completedTime, progress };
            });

            // If this task belongs to a mission, recalculate the mission's progress
            const task = updated.find(t => t.id === id);
            if (task?.missionId) {
                updated = recalcMissionProgress(updated, task.missionId);
                // Fire async Firestore update for the mission task too
                const mission = updated.find(t => t.id === task.missionId);
                if (mission) {
                    updateTaskInFirestore(mission.id, { status: mission.status, progress: mission.progress, details: `${updated.filter(t => t.missionId === mission.id && !t.isMission && t.status === 'completed').length}/${updated.filter(t => t.missionId === mission.id && !t.isMission).length} tasks done` }).catch(() => {});
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
