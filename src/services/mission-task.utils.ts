/**
 * Sentient File Header
 * Why: Mission task utilities for Sentient AI Browser
 * Filepath: src/services/mission-task.utils.ts
 * Description: Provides mission task interfaces and status update logic for Firestore
 * Trace: Used by mission planner, workflow, and orchestrator modules
 * Wiring: Exported functions, consumed by mission features and orchestrator
 */
// Feature: Missions | Trace: README.md
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../features/auth/firebase-config';

export interface MissionTask {
    id: string;
    title: string;
    action: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    targetId?: string;
    value?: string;
    explanation?: string;
}

export const getCurrentTaskForMission = (tasks: MissionTask[]): MissionTask | null => {
    const inProgress = tasks.find(t => t.status === 'in_progress');
    if (inProgress) return inProgress;
    return tasks.find(t => t.status === 'pending') || null;
};

export const updateMissionTaskStatus = async (
    missionId: string,
    taskId: string,
    status: string,
): Promise<MissionTask[]> => {
    const missionRef = doc(db, 'missions', missionId);
    const snap = await getDoc(missionRef);
    if (!snap.exists()) return [];
    const tasks = snap.data()?.tasks || [];
    return tasks.map((t: MissionTask) => (t.id === taskId ? { ...t, status } : t));
};
