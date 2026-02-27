import { db } from './proxy-config';
import { collection, query, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { processMissionStep } from './backend-mission.executor';

class BackendAIOrchestrator {
    private isListening: boolean = false;

    /**
     * start: Local listener for missions.
     * Use this when running the proxy server locally (fallback for no Blaze plan).
     */
    start() {
        if (this.isListening) return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Local AI Listener (No Blaze Fallback)...');
        
        onSnapshot(query(collection(db, 'missions')), (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.docChanges().forEach(async (change) => {
                const missionId = change.doc.id;
                const data = change.doc.data();
                if (data.status === 'active') {
                    await this.processMission(missionId, data);
                }
            });
        });
    }

    /**
     * processMission: Entry point for both Cloud Triggers and Local Listeners.
     */
    async processMission(missionId: string, data: any) {
        console.log(`[Orchestrator] Processing mission step for: ${data.goal}`);
        const res = await processMissionStep(missionId);
        
        if (res === 'done') {
            console.log(`[Orchestrator] Mission ${missionId} marked as completed.`);
        }
    }
}

export default new BackendAIOrchestrator();
