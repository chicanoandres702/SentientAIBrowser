// Feature: Tasks | Trace: src/features/tasks/tasks.service.ts
/*
 * [Service Layer] Firestore sync
 * [Upstream] Utils → [Downstream] API/DB
 * [Law Check] 50 lines | Passed
 */

import { doc, updateDoc, collection, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../auth/firebase-config';
import { TaskItem, MissionTask } from './tasks.types';

export const syncTaskToFirestore = async (userId: string, task: TaskItem): Promise<void> => {
    try {
        await setDoc(doc(db, 'users', userId, 'tasks', task.id), task, { merge: true });
    } catch (err) {
        console.error('[TaskService] syncTaskToFirestore failed:', err);
    }
};

export const updateTaskStatusInFirestore = async (missionId: string, taskId: string, status: string): Promise<void> => {
    try {
        const missionRef = doc(db, 'missions', missionId);
        const snap = await getDoc(missionRef);
        if (!snap.exists()) return;
        const tasks = snap.data()?.tasks || [];
        const updated = tasks.map((t: MissionTask) => (t.id === taskId ? { ...t, status } : t));
        await updateDoc(missionRef, { tasks: updated });
    } catch (err) {
        console.error('[TaskService] updateTaskStatusInFirestore failed:', err);
    }
};

export const listenToTasks = (userId: string, onUpdate: (tasks: TaskItem[]) => void): (() => void) => {
    return onSnapshot(collection(db, 'users', userId, 'tasks'), (snap) => {
        const tasks = snap.docs.map(d => d.data() as TaskItem);
        onUpdate(tasks);
    });
};

export const getCurrentMissionTasks = async (missionId: string): Promise<MissionTask[]> => {
    try {
        const snap = await getDoc(doc(db, 'missions', missionId));
        return snap.exists() ? (snap.data()?.tasks || []) : [];
    } catch (err) {
        console.error('[TaskService] getCurrentMissionTasks failed:', err);
        return [];
    }
};
