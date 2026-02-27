// Feature: Agent | Trace: src/features/agent/trace.md
import { db, auth } from '../auth/firebase-config';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { TaskItem, TaskStatus } from '../tasks/types';
import { planTacticalSteps } from '../llm/llm-task-planner.engine';

/**
 * AgentService: Coordinates high-level mission planning and tactical execution.
 * Bridges the gap between user prompts and the low-level decision engine.
 */
export class AgentService {
    private static COLLECTION = 'missions';

    /**
     * Starts a new mission by planning tactical steps and syncing to Firestore.
     */
    public static async startMission(goal: string, tabId: string): Promise<any> {
        const userId = auth.currentUser?.uid || 'anonymous';
        console.log(`[AgentService] Starting mission: ${goal}`);

        // 1. Plan tactical steps using the LLM (High-Fidelity)
        const missionResponse = await planTacticalSteps(goal);
        const steps = missionResponse?.execution.segments.flatMap(s => s.steps.map(step => step.explanation)) || [goal];

        // 2. Create mission document
        const missionRef = await addDoc(collection(db, this.COLLECTION), {
            goal,
            status: 'active',
            tabId,
            userId,
            progress: 0,
            currentStepIndex: 0,
            steps,
            lastAction: 'Mission started',
            timestamp: serverTimestamp(),
            updated_at: serverTimestamp()
        });

        // Return both the ID and the detailed response for the controller to use
        return { id: missionRef.id, missionResponse };
    }

    /**
     * Listens to mission updates for a specific user.
     */
    public static listenToMissions(userId: string, callback: (missions: any[]) => void) {
        const q = query(
            collection(db, this.COLLECTION),
            where('userId', '==', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(missions);
        });
    }
}
