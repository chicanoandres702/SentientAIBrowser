// Feature: Missions | Trace: src/utils/browser-sync-service.ts
import { db } from '../auth/firebase-config';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface MissionItem {
    id: string; goal: string; status: 'active' | 'paused' | 'completed' | 'failed';
    tabId: string; progress: number; lastAction: string; timestamp: number; userId: string;
}

export const syncMissionToFirestore = async (mission: MissionItem) => {
    const ref = db.collection('missions').doc(mission.id);
    await ref.set(sanitizeForCloud({ ...mission, updated_at: new Date().toISOString() }));
};

export const updateMissionInFirestore = async (id: string, updates: Partial<MissionItem>) => {
    const ref = db.collection('missions').doc(id);
    await ref.update(sanitizeForCloud({ ...updates, updated_at: new Date().toISOString() }));
};

export const listenToMissions = (userId: string, callback: (missions: MissionItem[]) => void) => {
    return db.collection('missions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .onSnapshot((snapshot) => {
            const missions: MissionItem[] = [];
            snapshot.forEach((doc) => missions.push({ ...doc.data(), id: doc.id } as MissionItem));
            callback(missions);
        });
};
