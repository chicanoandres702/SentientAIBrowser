// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';

export async function processMissionStep(missionId: string) {
    try {
        const missionRef = db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || snap.data()?.status !== 'active') return;
        const data = snap.data()!;
        const tabId = data.tabId || 'default';
        const userId = data.userId;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };

        const page = await getPersistentPage(null, tabId, userId);
        if (!page) return;

        const domMap = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, input, [role="button"]')).map((el: any, i) => {
                el.setAttribute('data-ai-id', i);
                return { id: i, tagName: el.tagName, text: el.innerText || el.value || el.placeholder, type: (el as any).type };
            });
        });

        const screenshot = (await page.screenshot({ quality: 50, type: 'jpeg' })).toString('base64');
        const response = await determineNextAction(userId, data.goal, domMap, screenshot, new URL(page.url()).hostname, [], true, context);
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
                await missionRef.update({ status: 'completed', progress: 100, lastAction: 'Mission Completed Successfully' });
                return 'done';
            }

            let result: 'success' | 'failure' = 'success';
            let observation = step.explanation;

            try {
                const sel = `[data-ai-id="${step.targetId}"]`;
                // Verification using domContext if provided
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
            } catch (err: any) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
                console.error(`[Executor] Step failed:`, observation);
            }

            await recordActionOutcome(userId, data.goal, step.action, result, observation, new URL(page.url()).hostname);
            await missionRef.update({
                lastAction: observation.substring(0, 100) + '...',
                progress: Math.min((data.progress || 0) + 2, 98), // Incremental progress
                updated_at: new Date().toISOString()
            });

            if (result === 'failure') break; // Stop chain on failure
        }
    } catch (e: any) {
        console.error(`[Executor] Fatal in mission ${missionId}:`, e.message);
    }
    return 'pending';
}
