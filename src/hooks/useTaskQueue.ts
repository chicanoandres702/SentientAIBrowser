// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] useTaskQueue refactor
 * [Subtask] Main hook composition - orchestrates all task management
 * [Upstream] 4 micro-hooks + Firestore -> [Downstream] Full task queue API
 * [Law Check] 95 lines | Passed 100-Line Law
 */
import { useEffect, useCallback, useRef } from 'react';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { useTaskStateManagement } from './task-hooks/useTaskStateManagement';
import { useSubActionStateMachine } from './task-hooks/useSubActionStateMachine';
import { useTaskPersistence } from './task-hooks/useTaskPersistence';
import { useTaskHierarchy } from './task-hooks/useTaskHierarchy';
import {
  updateTaskInFirestore,
} from '@features/task-queue/services/task-queue.sync.service';

export const useTaskQueue = () => {
    const { tasks, setTasks, mergeTaskSnapshot: _mergeTaskSnapshot, isTaskEquivalent, deriveProgress } = useTaskStateManagement();
    const { advanceSubActions } = useSubActionStateMachine();
    const { setupAuthListener, syncAdd, syncUpdate, syncRemove } = useTaskPersistence(setTasks, isTaskEquivalent);
    const { advanceTaskHierarchy } = useTaskHierarchy();
    const taskUnsubRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        return setupAuthListener(taskUnsubRef);
    }, [setupAuthListener]);

    const addTask = useCallback(async (title: string, status: TaskStatus = 'pending', details?: string, extra?: Partial<TaskItem>) => {
        const id = extra?.id || (Date.now().toString() + Math.random().toString());
        const now = Date.now();
        const newTask: TaskItem = {
            id,
            tabId: extra?.tabId || 'default',
            title,
            status,
            timestamp: now,
            details: details || "",
            progress: status === 'completed' ? 100 : 0,
            startTime: status === 'pending' ? undefined : now,
            estimatedDuration: 60000,
            ...extra,
        };
        setTasks(prev => [...prev, newTask]);
        await syncAdd(newTask);
        return id;
    }, [setTasks, syncAdd]);

    const updateTask = useCallback(async (id: string, status: TaskStatus, details?: string) => {
        let persistedStatus: TaskStatus = status;
        let persistedDetails: string = details || '';
        setTasks(prev => {
            const now = Date.now();
            let updated = prev.map(t => {
                if (t.id !== id) return t;
                const nextSubActions = advanceSubActions(t.subActions, status, details || t.details);
                const normalizedStatus: TaskStatus = status;
                const completedTime = normalizedStatus === 'completed' ? now : t.completedTime;
                const progress = deriveProgress(normalizedStatus, nextSubActions, t.progress);
                const startTime = (normalizedStatus === 'in_progress' && !t.startTime) ? now : t.startTime;
                persistedStatus = normalizedStatus;
                persistedDetails = details || t.details || '';
                return { ...t, status: normalizedStatus, details: details || t.details, completedTime, progress, startTime, subActions: nextSubActions };
            });
            updated = advanceTaskHierarchy(updated, id, status, now, deriveProgress, advanceSubActions, updateTaskInFirestore);
            return updated;
        });
        await syncUpdate(id, persistedStatus, persistedDetails);
    }, [advanceSubActions, deriveProgress, advanceTaskHierarchy, syncUpdate]);

    const removeTask = useCallback(async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        await syncRemove(id);
    }, [setTasks, syncRemove]);

    const clearTasks = useCallback(async () => {
        const currentTasks = tasks;
        setTasks([]);
        for (const t of currentTasks) await syncRemove(t.id);
    }, [tasks, setTasks, syncRemove]);

    const reorderMissions = useCallback((missionIds: string[]) => {
        setTasks(prev => {
            const ordered: TaskItem[] = [];
            missionIds.forEach(mid => {
                const mission = prev.find(t => t.id === mid && t.isMission);
                if (mission) ordered.push(mission);
                prev.filter(t => t.missionId === mid && !t.isMission).forEach(c => ordered.push(c));
            });
            prev.filter(t => !t.isMission && !t.missionId).forEach(t => ordered.push(t));
            return ordered;
        });
    }, [setTasks]);

    const removeMissionTasks = useCallback(async (missionId: string) => {
        const toRemove = tasks.filter(t => t.id === missionId || t.missionId === missionId);
        setTasks(prev => prev.filter(t => t.id !== missionId && t.missionId !== missionId));
        for (const t of toRemove) await syncRemove(t.id);
    }, [tasks, setTasks, syncRemove]);

    const removeTabTasks = useCallback(async (tabId: string) => {
        const toRemove = tasks.filter(t => t.tabId === tabId);
        setTasks(prev => prev.filter(t => t.tabId !== tabId));
        for (const t of toRemove) await syncRemove(t.id);
    }, [tasks, setTasks, syncRemove]);

    return { tasks, setTasks, addTask, updateTask, removeTask, clearTasks, editTask: () => {}, reorderMissions, removeMissionTasks, removeTabTasks };
};
