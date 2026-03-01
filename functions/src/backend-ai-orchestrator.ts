import { db } from './proxy-config';
import { processMissionStep } from './backend-mission.executor';

/** Pause between consecutive LLM decision cycles — prevents rate-limit exhaustion.
 *  Override with ORCHESTRATOR_STEP_DELAY_MS env var (milliseconds). */
const STEP_DELAY_MS = parseInt(process.env.ORCHESTRATOR_STEP_DELAY_MS || '2000', 10);

/** Hard cap on outer-loop iterations per mission (belt-and-suspenders on top of
 *  MAX_STEPS inside processMissionStep — guards against a hypothetical bug that
 *  keeps returning 'pending' without ever incrementing the internal step counter). */
const MAX_LOOP_ITERATIONS = 200;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class BackendAIOrchestrator {
    private isListening: boolean = false;
    /** Missions currently being driven by a local loop — prevents concurrent re-entry */
    private processingMissions = new Set<string>();

    /**
     * start: Local listener for missions.
     * Use this when running the proxy server locally (fallback for no Blaze plan).
     *
     * Why: We only react to 'added' events (new missions) plus 'modified' events that
     * transition a mission back to 'active' (e.g. after a 'paused' → 'active' resume).
     * We intentionally IGNORE 'modified' events triggered by our own missionRef.update()
     * calls inside processMissionStep — those would cause concurrent overlapping runs.
     * The self-driving runMissionLoop() below replaces event-driven chaining entirely.
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
                        // New mission OR existing active mission present at startup
                        this.runMissionLoop(missionId, data).catch((e) =>
                            console.error(`[Orchestrator] Loop error for ${missionId}:`, e.message));
                    } else if (change.type === 'modified' && data.status === 'active') {
                        // Only start a new loop when a mission has been explicitly resumed
                        // and is not already being processed (avoids re-entry from our own writes)
                        if (!this.processingMissions.has(missionId)) {
                            this.runMissionLoop(missionId, data).catch((e) =>
                                console.error(`[Orchestrator] Loop error for ${missionId}:`, e.message));
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

    /**
     * runMissionLoop: Self-driving agent loop.
     * Keeps calling processMissionStep until the mission reaches a terminal state
     * (done / failed) or is no longer active in Firestore.
     * This is the key mechanism that allows the mission to complete without the
     * user keeping the browser app open.
     */
    async runMissionLoop(missionId: string, data: any) {
        if (this.processingMissions.has(missionId)) {
            console.log(`[Orchestrator] Mission ${missionId} already running — skipping duplicate trigger.`);
            return;
        }
        this.processingMissions.add(missionId);
        console.log(`[Orchestrator] Starting mission loop for: ${data.goal}`);

        try {
            let iterations = 0;
            let hitLimit = true;
            while (iterations < MAX_LOOP_ITERATIONS) {
                iterations++;
                const res = await processMissionStep(missionId);

                if (res === 'done') {
                    console.log(`[Orchestrator] Mission ${missionId} completed.`);
                    hitLimit = false;
                    break;
                }
                if (res === 'failed') {
                    console.warn(`[Orchestrator] Mission ${missionId} failed.`);
                    hitLimit = false;
                    break;
                }

                // 'pending' — verify the mission is still active before continuing
                const snap = await db.collection('missions').doc(missionId).get();
                if (!snap.exists || snap.data()?.status !== 'active') {
                    console.log(`[Orchestrator] Mission ${missionId} is no longer active — stopping loop.`);
                    hitLimit = false;
                    break;
                }

                // Brief pause between decision cycles to respect LLM rate limits
                await sleep(STEP_DELAY_MS);
            }
            // Only fire if the hard cap was actually reached (not a normal exit via break)
            if (hitLimit) {
                console.warn(`[Orchestrator] Mission ${missionId} exceeded MAX_LOOP_ITERATIONS (${MAX_LOOP_ITERATIONS}). Terminating.`);
                await db.collection('missions').doc(missionId).update({
                    status: 'failed',
                    lastAction: `Orchestrator iteration limit reached (${MAX_LOOP_ITERATIONS})`,
                    updated_at: new Date().toISOString(),
                });
            }
        } finally {
            this.processingMissions.delete(missionId);
        }
    }

    /**
     * processMission: Kept for backward compatibility with Cloud Function triggers.
     */
    async processMission(missionId: string, data: any) {
        await this.runMissionLoop(missionId, data);
    }
}

export default new BackendAIOrchestrator();
