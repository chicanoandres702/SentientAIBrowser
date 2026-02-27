// Feature: Outcomes | Trace: src/utils/browser-sync-service.ts
import { db } from '../auth/firebase-config';
import { sanitizeForCloud } from './safe-cloud.utils';

export interface MissionOutcome {
    id: string; goal: string; action: string; result: 'success' | 'failure';
    observation: string; timestamp: number; userId: string;
}

export const logMissionOutcome = async (outcome: MissionOutcome) => {
    const ref = db.collection('mission_outcomes').doc(outcome.id);
    await ref.set(sanitizeForCloud({ ...outcome, updated_at: new Date().toISOString() }));
};

export const getRelevantOutcomes = async (userId: string, goalPattern: string) => {
    const snap = await db.collection('mission_outcomes')
        .where('userId', '==', userId)
        .limit(20)
        .get();
        
    const outcomes: MissionOutcome[] = [];
    snap.forEach(d => {
        const data = d.data() as MissionOutcome;
        if (data.goal.toLowerCase().includes(goalPattern.toLowerCase())) outcomes.push({ ...data, id: d.id });
    });
    return outcomes;
};
