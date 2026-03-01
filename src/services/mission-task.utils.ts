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
