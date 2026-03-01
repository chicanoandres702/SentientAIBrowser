// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
// Technique: browser-use/web-ui — max_steps guard + consecutive_failures tracking (BrowserUseAgent.run)
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';

/** Max LLM decision cycles per mission before forcing termination */
const MAX_STEPS = 50;
/** Abort mission after this many back-to-back action failures */
const MAX_CONSECUTIVE_FAILURES = 3;

const updateFailed = async (missionRef: any, msg: string) => {
    await missionRef.update({ status: 'failed', lastAction: msg, updated_at: new Date().toISOString() });
    return 'failed';
};

export async function processMissionStep(missionId: string) {
    try {
        const missionRef = db.collection('missions').doc(missionId);
        const snap = await missionRef.get(); if (!snap.exists || snap.data()?.status !== 'active') return;
        const data = snap.data()!, tabId = data.tabId || 'default', userId = data.userId;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const stepCount: number = data.stepCount || 0, consecutiveFailures: number = data.consecutiveFailures || 0;
        if (stepCount >= MAX_STEPS) return updateFailed(missionRef, `Exceeded maximum steps (${MAX_STEPS})`);
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) return updateFailed(missionRef, `Too many consecutive failures (${MAX_CONSECUTIVE_FAILURES})`);

        const page = await getPersistentPage(null, tabId, userId); if (!page) return;

        const domMap = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, input, [role="button"]')).map((el: any, i) => {
                el.setAttribute('data-ai-id', i);
                return { id: i, tagName: el.tagName, text: el.innerText || el.value || el.placeholder, type: (el as any).type };
            });
        });

        const screenshot = (await page.screenshot({ quality: 50, type: 'jpeg' })).toString('base64');
        const response = await determineNextAction(userId, data.goal, domMap, screenshot, new URL(page.url()).hostname, [], true, context); if (!response) return;

        await missionRef.update({ intelligenceSignals: response.meta.intelligenceSignals || [], lastReasoning: response.meta.reasoning, updated_at: new Date().toISOString() });

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
            }
            if (step.action === 'done') {
                await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                await missionRef.update({ status: 'completed', progress: 100, stepCount: stepCount + 1, consecutiveFailures: 0, lastAction: 'Mission Completed Successfully' });
                return 'done';
            }

            let result: 'success' | 'failure' = 'success';
            let observation = step.explanation;

            try {
                const sel = `[data-ai-id="${step.targetId}"]`;
                if (step.domContext?.tagName) {
                    const isCorrect = await page.evaluate(({ sel, tag }) => {
                        const el = document.querySelector(sel);
                        return el?.tagName === tag;
                    }, { sel, tag: step.domContext.tagName });
                    if (!isCorrect) console.warn(`[Executor] Warning: DOM Context mismatch for ${sel}`);
                }
                if (step.action === 'click') await page.click(sel, { timeout: 8000 });
                else if (step.action === 'type' && step.value) {
                    await page.fill(sel, step.value);
                    await page.keyboard.press('Enter');
                }
                else if (step.action === 'wait') await page.waitForTimeout(2000);
                else if (step.action === 'upload_file' && step.value) {
                    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                    const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                    if (!allowed.includes(ext)) throw new Error(`File type "${ext}" not permitted`);
                    await page.setInputFiles(sel, step.value);
                }
            } catch (err: any) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
                console.error(`[Executor] Step failed:`, observation);
            }

            await recordActionOutcome(userId, data.goal, step.action, result, observation, new URL(page.url()).hostname);
            const freshSnap = await missionRef.get();
            const currentProgress = freshSnap.data()?.progress || 0;
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
                break;
            }
        }
    } catch (e: any) {
        console.error(`[Executor] Fatal in mission ${missionId}:`, e.message);
    }
    return 'pending';
}
