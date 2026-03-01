// Feature: Mission Executor | Trace: src/features/agent/trace.md
// Why: Isolated self-driving loop so BackendAIOrchestrator stays < 100 lines (100-Line Law).
// The loop is the critical mechanism that lets missions run to completion without
// the user's browser being open — it drives processMissionStep repeatedly until
// the mission reaches a terminal state or the Firestore document is no longer active.
import { db } from './proxy-config';
import { processMissionStep } from './backend-mission.executor';
import { openMissionIssue, openStepIssue, closeMissionIssue } from './features/github/github-tracer.service';

/** Pause between consecutive LLM cycles — short enough to feel live, long enough to avoid rate-limit.
 *  Override with ORCHESTRATOR_STEP_DELAY_MS env var (milliseconds). */
export const STEP_DELAY_MS = parseInt(process.env.ORCHESTRATOR_STEP_DELAY_MS || '500', 10);

// Why: No iteration cap — the mission runs indefinitely until the user stops it
// (by setting status ≠ 'active' in Firestore) or the LLM emits action 'done'.

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
        // Why: Infinite loop — only exits when the user stops the mission (status ≠ 'active')
        // or the LLM emits 'done'. No time/iteration cap by design.
        while (true) {
            iterations++;
            const res = await processMissionStep(missionId);

            if (res === 'done') {
                console.log(`[MissionLoop] ✅ Mission ${missionId} completed after ${iterations} cycles.`);
                if (epicNum) await closeMissionIssue(epicNum, 'completed');
                break;
            }

            // Why: Step issues track progress in GitHub — only on 'pending' cycles.
            if (epicNum) await openStepIssue(missionId, iterations, `Decision cycle ${iterations}: ${goal.slice(0, 50)}`, epicNum);

            // Check if user manually stopped the mission between cycles
            const snap = await db.collection('missions').doc(missionId).get();
            if (!snap.exists || snap.data()?.status !== 'active') {
                console.log(`[MissionLoop] ⏹ Mission ${missionId} stopped by user (status: ${snap.data()?.status}).`);
                break;
            }

            await sleep(STEP_DELAY_MS);
        }
    } finally {
        processingMissions.delete(missionId);
    }
}
