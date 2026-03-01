// Feature: Mission Executor | Trace: src/features/agent/trace.md
// Why: Single Firestore listener that reacts to new/resumed missions and delegates
// all execution to runMissionLoop — keeps this file focused on event routing only.
// Complies with the 100-Line Law by extracting loop logic to backend-mission-loop.ts.
import { db } from './proxy-config';
import { runMissionLoop } from './backend-mission-loop';

class BackendAIOrchestrator {
    private isListening: boolean = false;
    /** Missions currently being driven by a loop — in-process mutex against concurrent re-entry */
    private processingMissions = new Set<string>();

    /**
     * start: Local Firestore listener (fallback when Cloud Functions are not available).
     * Why: We only react to 'added' events (new missions) plus 'modified' events that
     * transition a mission back to 'active' (resume). We intentionally IGNORE 'modified'
     * events triggered by our own missionRef.update() calls inside processMissionStep —
     * those would spawn concurrent overlapping loops for the same mission.
     */
    start() {
        if (this.isListening) return;
        this.isListening = true;
        console.log('[Orchestrator] Starting Local AI Listener (Admin SDK Mode)...');

        try {
            db.collection('missions').where('status', '==', 'active').onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const missionId = change.doc.id;
                    const data = change.doc.data();

                    if (change.type === 'added') {
                        // Why: 'added' fires for new missions AND for active missions present at startup.
                        this.runLoop(missionId, data);
                    } else if (change.type === 'modified' && data.status === 'active') {
                        // Why: Only start a loop on an explicit resume, never from our own writes.
                        if (!this.processingMissions.has(missionId)) {
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

    /** processMission: Kept for backward compatibility with Cloud Function triggers. */
    async processMission(missionId: string, data: any) {
        await runMissionLoop(missionId, data.goal, this.processingMissions);
    }
}

export default new BackendAIOrchestrator();

