"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Feature: Backend Orchestrator | Trace: README.md
const proxy_config_1 = require("./proxy-config");
const backend_mission_loop_1 = require("./backend-mission-loop");
class BackendAIOrchestrator {
    constructor() {
        this.isListening = false;
        /** Missions currently being driven by a loop — in-process mutex against concurrent re-entry */
        this.processingMissions = new Set();
    }
    /**
     * start: Local Firestore listener (fallback when Cloud Functions are not available).
     * Why: We only react to 'added' events (new missions) plus 'modified' events that
     * transition a mission back to 'active' (resume). We intentionally IGNORE 'modified'
     * events triggered by our own missionRef.update() calls inside processMissionStep —
     * those would spawn concurrent overlapping loops for the same mission.
     */
    start() {
        if (this.isListening)
            return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Local AI Listener (Admin SDK Mode)...');
        try {
            proxy_config_1.db.collection('missions').where('status', '==', 'active').onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const missionId = change.doc.id;
                    const data = change.doc.data();
                    if (change.type === 'added') {
                        // Why: 'added' fires for new missions AND for active missions present at startup.
                        this.runLoop(missionId, data);
                    }
                    else if (change.type === 'modified' && data.status === 'active') {
                        // Why: Only start a loop on an explicit resume, never from our own writes.
                        if (!this.processingMissions.has(missionId)) {
                            this.runLoop(missionId, data);
                        }
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
    /** Thin wrapper that surfaces loop errors to the console without crashing the listener. */
    runLoop(missionId, data) {
        (0, backend_mission_loop_1.runMissionLoop)(missionId, data.goal, this.processingMissions).catch((e) => console.error(`[Orchestrator] Loop error for ${missionId}:`, e.message));
    }
    /** processMission: Kept for backward compatibility with Cloud Function triggers. */
    async processMission(missionId, data) {
        await (0, backend_mission_loop_1.runMissionLoop)(missionId, data.goal, this.processingMissions);
    }
}
exports.default = new BackendAIOrchestrator();
//# sourceMappingURL=backend-ai-orchestrator.js.map