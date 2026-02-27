"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_config_1 = require("./proxy-config");
const firestore_1 = require("firebase/firestore");
const backend_mission_executor_1 = require("./backend-mission.executor");
class BackendAIOrchestrator {
    constructor() {
        this.isListening = false;
    }
    /**
     * start: Local listener for missions.
     * Use this when running the proxy server locally (fallback for no Blaze plan).
     */
    start() {
        if (this.isListening)
            return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Local AI Listener (No Blaze Fallback)...');
        (0, firestore_1.onSnapshot)((0, firestore_1.query)((0, firestore_1.collection)(proxy_config_1.db, 'missions')), (snapshot) => {
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
    async processMission(missionId, data) {
        console.log(`[Orchestrator] Processing mission step for: ${data.goal}`);
        const res = await (0, backend_mission_executor_1.processMissionStep)(missionId);
        if (res === 'done') {
            console.log(`[Orchestrator] Mission ${missionId} marked as completed.`);
        }
    }
}
exports.default = new BackendAIOrchestrator();
//# sourceMappingURL=backend-ai-orchestrator.js.map