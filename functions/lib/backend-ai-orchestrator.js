"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * [Parent Feature/Milestone] Backend Execution
 * [Child Task/Issue] fix: one active mission per user — no parallel executor chaos
 * [Subtask] Per-user latest-mission tracking + stale-mission auto-abandon on startup
 * [Law Check] 62 lines | Passed 100-Line Law
 */
// Feature: Backend Orchestrator | Trace: README.md
const proxy_config_1 = require("./proxy-config");
const backend_mission_loop_1 = require("./backend-mission-loop");
class BackendAIOrchestrator {
    constructor() {
        this.isListening = false;
        /** Missions currently being driven by a loop — in-process mutex against concurrent re-entry */
        this.processingMissions = new Set();
        /**
         * Latest missionId per userId — ensures only the NEWEST mission runs per user.
         * Why: onSnapshot fires 'added' for ALL active missions at startup (including stale ones
         * from previous sessions). Without this guard, every old mission starts its own loop,
         * creating parallel executors that fight over the same Playwright tabs.
         */
        this.latestMissionPerUser = new Map();
    }
    /** Parse epoch-ms from a missionId that may be "timestamp_randomsuffix" or plain "timestamp". */
    static tsOf(id) { return parseInt(id.split('_')[0], 10) || 0; }
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
                    const userId = data.userId || 'anonymous';
                    if (change.type === 'added') {
                        // Compare epoch-ms prefix so random suffix doesn't break ordering
                        const prev = this.latestMissionPerUser.get(userId);
                        if (prev && BackendAIOrchestrator.tsOf(prev) > BackendAIOrchestrator.tsOf(missionId)) {
                            // This 'added' is an OLDER stale mission; auto-abandon it
                            console.log(`[Orchestrator] 🗑 Abandoning stale mission ${missionId} (newer: ${prev})`);
                            proxy_config_1.db.collection('missions').doc(missionId)
                                .update({ status: 'completed', lastAction: '⏹ Abandoned — superseded by newer mission' })
                                .catch(() => { });
                            return;
                        }
                        this.latestMissionPerUser.set(userId, missionId);
                        this.runLoop(missionId, data);
                    }
                    else if (change.type === 'modified' && data.status === 'active') {
                        // Only resume if no loop is already running for this mission
                        if (!this.processingMissions.has(missionId)) {
                            this.latestMissionPerUser.set(userId, missionId);
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
    /** processMission: Kept for backward compatibility. */
    async processMission(missionId, data) {
        await (0, backend_mission_loop_1.runMissionLoop)(missionId, data.goal, this.processingMissions);
    }
}
exports.default = new BackendAIOrchestrator();
//# sourceMappingURL=backend-ai-orchestrator.js.map