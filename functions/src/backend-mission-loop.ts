// Feature: Mission Executor | Trace: src/features/agent/trace.md
// Why: Isolated self-driving loop so BackendAIOrchestrator stays < 100 lines (100-Line Law).
// The loop is the critical mechanism that lets missions run to completion without
// the user's browser being open — it drives processMissionStep repeatedly until
// the mission reaches a terminal state or the Firestore document is no longer active.
import { db } from './proxy-config';
import { processMissionStep } from './backend-mission.executor';
import { openMissionIssue, openStepIssue, closeMissionIssue } from './features/github/github-tracer.service';

/** Pause between consecutive LLM decision cycles — prevents rate-limit exhaustion.
 *  Override with ORCHESTRATOR_STEP_DELAY_MS env var (milliseconds). */
export const STEP_DELAY_MS = parseInt(process.env.ORCHESTRATOR_STEP_DELAY_MS || '2000', 10);

/** Hard cap on outer-loop iterations per mission (belt-and-suspenders on top of
 *  MAX_STEPS inside processMissionStep — guards against a hypothetical bug that
 *  keeps returning 'pending' without ever incrementing the internal step counter). */
export const MAX_LOOP_ITERATIONS = 200;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * runMissionLoop: Self-driving agent loop.
 * Why: Keeps calling processMissionStep until the mission reaches a terminal state
 * (done / failed) or is no longer active in Firestore.
 * This replaces the old single-shot event handler that stalled on 'pending'.
 * The processingMissions Set (passed by reference) acts as an in-process mutex so
 * the Firestore listener cannot spawn a second loop for the same mission.
 */
export async function runMissionLoop(
    missionId: string,
    goal: string,
    processingMissions: Set<string>,
): Promise<void> {
    if (processingMissions.has(missionId)) {
        console.log(`[MissionLoop] ${missionId} already running — skipping duplicate trigger.`);
        return;
    }
    processingMissions.add(missionId);
    console.log(`[MissionLoop] Starting loop for: ${goal}`);

    // Why: Epic issue is the root of the §6 Issue Hierarchy tree for this mission.
    // If GitHub env vars are absent the tracer is a no-op — missions run unchanged.
    const epicNum = await openMissionIssue(missionId, goal);

    try {
        let iterations = 0;
        let hitLimit = true;
        while (iterations < MAX_LOOP_ITERATIONS) {
            iterations++;
            const res = await processMissionStep(missionId);

            if (res === 'done') {
                console.log(`[MissionLoop] Mission ${missionId} completed.`);
                if (epicNum) await closeMissionIssue(epicNum, 'completed');
                hitLimit = false; break;
            }
            if (res === 'failed') {
                console.warn(`[MissionLoop] Mission ${missionId} failed.`);
                if (epicNum) await closeMissionIssue(epicNum, 'failed');
                hitLimit = false; break;
            }

            // Why: Step issues are only created for 'pending' cycles — avoids orphaned
            // open issues when a cycle immediately reaches done/failed.
            if (epicNum) await openStepIssue(missionId, iterations, `Decision cycle ${iterations}: ${goal.slice(0, 50)}`, epicNum);

            // 'pending' — verify the mission is still active before continuing
            const snap = await db.collection('missions').doc(missionId).get();
            if (!snap.exists || snap.data()?.status !== 'active') {
                console.log(`[MissionLoop] Mission ${missionId} no longer active — stopping.`);
                hitLimit = false; break;
            }

            await sleep(STEP_DELAY_MS);
        }

        // Why: Only fires when the hard cap is reached, never on a normal exit via break.
        if (hitLimit) {
            console.warn(`[MissionLoop] Mission ${missionId} hit MAX_LOOP_ITERATIONS (${MAX_LOOP_ITERATIONS}).`);
            await db.collection('missions').doc(missionId).update({
                status: 'failed',
                lastAction: `Orchestrator iteration limit reached (${MAX_LOOP_ITERATIONS})`,
                updated_at: new Date().toISOString(),
            });
            if (epicNum) await closeMissionIssue(epicNum, 'failed');
        }
    } finally {
        processingMissions.delete(missionId);
    }
}
