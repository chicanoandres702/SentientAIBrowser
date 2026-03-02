/*
 * [Parent Feature/Milestone] Backend Execution
 * [Child Task/Issue] fix: one active mission per user — no parallel executor chaos
 * [Subtask] Per-user latest-mission tracking + stale-mission auto-abandon on startup
 * [Law Check] 62 lines | Passed 100-Line Law
 */
// Feature: Backend Orchestrator | Trace: README.md
import { db } from './proxy-config';
import { runMissionLoop } from './backend-mission-loop';

class BackendAIOrchestrator {
    private isListening: boolean = false;
    /** Missions currently being driven by a loop — in-process mutex against concurrent re-entry */
    private processingMissions = new Set<string>();
    /**
     * Latest missionId per userId — ensures only the NEWEST mission runs per user.
     * Why: onSnapshot fires 'added' for ALL active missions at startup (including stale ones
     * from previous sessions). Without this guard, every old mission starts its own loop,
     * creating parallel executors that fight over the same Playwright tabs.
     */
    private latestMissionPerUser = new Map<string, string>();

    /** Parse epoch-ms from a missionId that may be "timestamp_randomsuffix" or plain "timestamp". */
    private static tsOf(id: string): number { return parseInt(id.split('_')[0], 10) || 0; }

    start() {
        if (this.isListening) return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Local AI Listener (Admin SDK Mode)...');

        try {
            db.collection('missions').where('status', '==', 'active').onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const missionId = change.doc.id;
                    const data = change.doc.data();
                    const userId: string = data.userId || 'anonymous';

                    if (change.type === 'added') {
                        // Compare epoch-ms prefix so random suffix doesn't break ordering
                        const prev = this.latestMissionPerUser.get(userId);
                        if (prev && BackendAIOrchestrator.tsOf(prev) > BackendAIOrchestrator.tsOf(missionId)) {
                            // This 'added' is an OLDER stale mission; auto-abandon it
                            console.log(`[Orchestrator] 🗑 Abandoning stale mission ${missionId} (newer: ${prev})`);
                            db.collection('missions').doc(missionId)
                                .update({ status: 'completed', lastAction: '⏹ Abandoned — superseded by newer mission' })
                                .catch(() => {});
                            return;
                        }
                        this.latestMissionPerUser.set(userId, missionId);
                        this.runLoop(missionId, data);
                    } else if (change.type === 'modified' && data.status === 'active') {
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
        } catch (e: any) {
            console.warn('[Orchestrator] Could not start Firestore listener:', e.message);
        }
    }

    /** Thin wrapper that surfaces loop errors to the console without crashing the listener. */
    private runLoop(missionId: string, data: any) {
        runMissionLoop(missionId, data.goal, this.processingMissions).catch((e) =>
            console.error(`[Orchestrator] Loop error for ${missionId}:`, e.message));
    }

    /** processMission: Kept for backward compatibility. */
    async processMission(missionId: string, data: any) {
        await runMissionLoop(missionId, data.goal, this.processingMissions);
    }
}

export default new BackendAIOrchestrator();

