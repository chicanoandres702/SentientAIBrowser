// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
// Technique: Playwright MCP — ARIA snapshots replace data-ai-id indices; role+name selectors
// are stable across DOM mutations. Technique sourced from @playwright/mcp architecture.
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';
import { getAriaSnapshot, executeAriaAction, AriaStep } from './playwright-mcp-adapter';

/** Max LLM decision cycles per mission before forcing termination */
const MAX_STEPS = 50;
/** Abort mission after this many back-to-back action failures */
const MAX_CONSECUTIVE_FAILURES = 3;

export async function processMissionStep(missionId: string) {
    try {
        const missionRef = db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || snap.data()?.status !== 'active') return;
        const data = snap.data()!;
        const tabId = data.tabId || 'default';
        const userId = data.userId;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };

        // Restore step counters persisted in Firestore so re-triggers accumulate correctly
        const stepCount: number = data.stepCount || 0;
        const consecutiveFailures: number = data.consecutiveFailures || 0;

        // --- browser-use/web-ui: max_steps guard ---
        if (stepCount >= MAX_STEPS) {
            console.warn(`[Executor] Mission ${missionId} reached MAX_STEPS (${MAX_STEPS}). Terminating.`);
            await missionRef.update({
                status: 'failed',
                lastAction: `Exceeded maximum steps (${MAX_STEPS})`,
                updated_at: new Date().toISOString()
            });
            return 'failed';
        }

        // --- browser-use/web-ui: consecutive failures guard ---
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.warn(`[Executor] Mission ${missionId} hit MAX_CONSECUTIVE_FAILURES (${MAX_CONSECUTIVE_FAILURES}). Terminating.`);
            await missionRef.update({
                status: 'failed',
                lastAction: `Too many consecutive failures (${MAX_CONSECUTIVE_FAILURES})`,
                updated_at: new Date().toISOString()
            });
            return 'failed';
        }

        const page = await getPersistentPage(null, tabId, userId);
        if (!page) return;

        // Why: ARIA snapshot = @playwright/mcp's browser_snapshot tool output.
        // Gives the LLM stable role+name refs that survive any DOM mutation.
        const ariaSnapshot = await getAriaSnapshot(page);
        const screenshot = (await page.screenshot({ quality: 50, type: 'jpeg' })).toString('base64');
        const response = await determineNextAction(
            userId, data.goal, [], screenshot,
            new URL(page.url()).hostname, [], true, context, ariaSnapshot
        );
        if (!response) return;

        // Log logical signals and high-level reasoning
        await missionRef.update({
            intelligenceSignals: response.meta.intelligenceSignals || [],
            lastReasoning: response.meta.reasoning,
            updated_at: new Date().toISOString()
        });

        // Flatten all segments into a single atomic queue
        const stepQueue = response.execution.segments.flatMap(s => s.steps);

        for (const step of stepQueue) {
            console.log(`[Executor] Executing Step: ${step.action} on ${step.targetId} (${step.explanation})`);

            if (step.action === 'wait_for_user' || step.action === 'ask_user') {
                await missionRef.update({ status: 'waiting', lastAction: `Waiting: ${step.explanation}` });
                return 'pending';
            }

            if (step.action === 'record_knowledge' && step.value) {
                const targetContext = { ...context, ...(step.knowledgeContext || {}) };
                await saveContextualKnowledge(userId, targetContext, 'rule', step.value);
                await missionRef.update({ lastAction: `Stored knowledge: ${step.value.substring(0, 30)}...` });
                // We DON'T continue; we execute the rest of the chain if possible
            }

            if (step.action === 'done') {
                await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                await missionRef.update({ status: 'completed', progress: 100, stepCount: stepCount + 1, consecutiveFailures: 0, lastAction: 'Mission Completed Successfully' });
                return 'done';
            }

            let result: 'success' | 'failure' = 'success';
            let observation = step.explanation;

            try {
                if (step.action === 'upload_file' && step.value) {
                    // File upload: no ARIA equivalent, use type=file input locator
                    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                    const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                    if (!allowed.includes(ext)) throw new Error(`File type "${ext}" not permitted`);
                    await page.locator('input[type="file"]').first().setInputFiles(step.value);
                } else {
                    // Why: executeAriaAction uses page.getByRole / getByLabel / getByText —
                    // the same mechanism @playwright/mcp uses. Selectors resolve fresh at
                    // call time so they survive any DOM change from previous steps.
                    await executeAriaAction(page, step as AriaStep);
                }
            } catch (err: any) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
                console.error(`[Executor] Step failed:`, observation);
            }

            await recordActionOutcome(userId, data.goal, step.action, result, observation, new URL(page.url()).hostname);

            // Read fresh progress from Firestore to avoid stale accumulation
            const freshSnap = await missionRef.get();
            const currentProgress = freshSnap.data()?.progress || 0;

            // --- browser-use/web-ui: increment stepCount; reset or increment consecutiveFailures ---
            const nextStep = stepCount + 1;
            const nextConsecutiveFailures = result === 'failure' ? consecutiveFailures + 1 : 0;

            await missionRef.update({
                lastAction: observation.substring(0, 100) + '...',
                progress: Math.min(currentProgress + Math.ceil(90 / stepQueue.length), 98),
                stepCount: nextStep,
                consecutiveFailures: nextConsecutiveFailures,
                updated_at: new Date().toISOString()
            });

            if (result === 'failure') {
                console.warn(`[Executor] Consecutive failures: ${nextConsecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
                break; // Stop chain; next Firestore trigger will hit the guard at the top
            }
        }
    } catch (e: any) {
        console.error(`[Executor] Fatal in mission ${missionId}:`, e.message);
    }
    return 'pending';
}
