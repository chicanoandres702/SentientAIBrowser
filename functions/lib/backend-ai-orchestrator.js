"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxy_config_1 = require("./proxy-config");
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
        console.log('[Orchestrator] Starting Local AI Listener (Admin SDK Mode)...');
        try {
            proxy_config_1.db.collection('missions').where('status', '==', 'active').onSnapshot((snapshot) => {
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
        }
        catch (e) {
            console.warn('[Orchestrator] Could not start Firestore listener:', e.message);
        }
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