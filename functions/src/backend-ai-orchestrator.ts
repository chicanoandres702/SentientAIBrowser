// Feature: Backend Orchestrator | Trace: README.md
import { db } from './proxy-config';
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
        console.log('[Orchestrator] Starting Local AI Listener (Admin SDK Mode)...');
        
        try {
            db.collection('missions').where('status', '==', 'active').onSnapshot((snapshot) => {
                snapshot.docChanges().forEach(async (change) => {
                    if (change.type === 'added' || change.type === 'modified') {
                        const missionId = change.doc.id;
                        const data = change.doc.data();
                        await this.processMission(missionId, data);
                    }
                });
            }, (error) => {
                console.warn('[Orchestrator] Firestore listener error (degrading gracefully):', error.message);
            });
        } catch (e: any) {
            console.warn('[Orchestrator] Could not start Firestore listener:', e.message);
        }
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
