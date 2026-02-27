// Feature: AI Orchestration | Trace: scripts/orchestrator.service.js
import { db } from './proxy-config';
import { collection, query, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { processMissionStep } from './backend-mission.executor';

class BackendAIOrchestrator {
    private activeMissions: Map<string, NodeJS.Timeout> = new Map();
    private isListening: boolean = false;

    start() {
        if (this.isListening) return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Backend AI Loop...');
        onSnapshot(query(collection(db, 'missions')), (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.docChanges().forEach(async (change) => {
                const missionId = change.doc.id;
                const data = change.doc.data();
                if (data.status === 'active') this.startMissionLoop(missionId, data);
                else this.stopMissionLoop(missionId);
            });
        });
    }

    async startMissionLoop(missionId: string, data: any) {
        if (this.activeMissions.has(missionId)) return;
        console.log(`[Orchestrator] Launching Loop for: ${data.goal}`);
        this.activeMissions.set(missionId, (setInterval as any)(async () => {
            const res = await processMissionStep(missionId);
            if (res === 'done') this.stopMissionLoop(missionId);
        }, 10000));
    }

    stopMissionLoop(missionId: string) {
        if (this.activeMissions.has(missionId)) {
            clearInterval(this.activeMissions.get(missionId)!);
            this.activeMissions.delete(missionId);
            console.log(`[Orchestrator] Stopped Mission: ${missionId}`);
        }
    }
}

export default new BackendAIOrchestrator();
