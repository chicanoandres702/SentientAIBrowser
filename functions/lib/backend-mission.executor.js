"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionStep = processMissionStep;
// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
const proxy_config_1 = require("./proxy-config");
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const llm_memory_service_1 = require("./features/llm/llm-memory-service");
const knowledge_hierarchy_service_1 = require("./features/llm/knowledge-hierarchy.service");
async function processMissionStep(missionId) {
    var _a, _b, _c;
    try {
        const missionRef = proxy_config_1.db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'active')
            return;
        const data = snap.data();
        const tabId = data.tabId || 'default';
        const userId = data.userId;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const page = await (0, proxy_page_handler_1.getPersistentPage)(null, tabId, userId);
        if (!page)
            return;
        const domMap = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button, a, input, [role="button"]')).map((el, i) => {
                el.setAttribute('data-ai-id', i);
                return { id: i, tagName: el.tagName, text: el.innerText || el.value || el.placeholder, type: el.type };
            });
        });
        const screenshot = (await page.screenshot({ quality: 50, type: 'jpeg' })).toString('base64');
        const response = await (0, llm_decision_engine_1.determineNextAction)(userId, data.goal, domMap, screenshot, new URL(page.url()).hostname, [], true, context);
        if (!response)
            return;
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
                const targetContext = Object.assign(Object.assign({}, context), (step.knowledgeContext || {}));
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, targetContext, 'rule', step.value);
                await missionRef.update({ lastAction: `Stored knowledge: ${step.value.substring(0, 30)}...` });
                // We DON'T continue; we execute the rest of the chain if possible
            }
            if (step.action === 'done') {
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                await missionRef.update({ status: 'completed', progress: 100, lastAction: 'Mission Completed Successfully' });
                return 'done';
            }
            let result = 'success';
            let observation = step.explanation;
            try {
                const sel = `[data-ai-id="${step.targetId}"]`;
                // Verification using domContext if provided
                if ((_b = step.domContext) === null || _b === void 0 ? void 0 : _b.tagName) {
                    const isCorrect = await page.evaluate(({ sel, tag }) => {
                        const el = document.querySelector(sel);
                        return (el === null || el === void 0 ? void 0 : el.tagName) === tag;
                    }, { sel, tag: step.domContext.tagName });
                    if (!isCorrect)
                        console.warn(`[Executor] Warning: DOM Context mismatch for ${sel}`);
                }
                if (step.action === 'click')
                    await page.click(sel, { timeout: 8000 });
                else if (step.action === 'type' && step.value) {
                    await page.fill(sel, step.value);
                    await page.keyboard.press('Enter');
                }
                else if (step.action === 'wait')
                    await page.waitForTimeout(2000);
            }
            catch (err) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
                console.error(`[Executor] Step failed:`, observation);
            }
            await (0, llm_memory_service_1.recordActionOutcome)(userId, data.goal, step.action, result, observation, new URL(page.url()).hostname);
            // Read fresh progress from Firestore to avoid stale accumulation
            const freshSnap = await missionRef.get();
            const currentProgress = ((_c = freshSnap.data()) === null || _c === void 0 ? void 0 : _c.progress) || 0;
            await missionRef.update({
                lastAction: observation.substring(0, 100) + '...',
                progress: Math.min(currentProgress + Math.ceil(90 / stepQueue.length), 98),
                updated_at: new Date().toISOString()
            });
            if (result === 'failure')
                break; // Stop chain on failure
        }
    }
    catch (e) {
        console.error(`[Executor] Fatal in mission ${missionId}:`, e.message);
    }
    return 'pending';
}
//# sourceMappingURL=backend-mission.executor.js.map