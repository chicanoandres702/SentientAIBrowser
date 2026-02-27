"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionStep = processMissionStep;
// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
const proxy_config_1 = require("./proxy-config");
const firestore_1 = require("firebase/firestore");
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const llm_memory_service_1 = require("./features/llm/llm-memory-service");
const knowledge_hierarchy_service_1 = require("./features/llm/knowledge-hierarchy.service");
async function processMissionStep(missionId) {
    var _a;
    try {
        const missionRef = (0, firestore_1.doc)(proxy_config_1.db, 'missions', missionId);
        const snap = await (0, firestore_1.getDoc)(missionRef);
        if (!snap.exists() || snap.data().status !== 'active')
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
        const response = await (0, llm_decision_engine_1.determineNextAction)(data.goal, domMap, screenshot, new URL(page.url()).hostname, [], true, context);
        if (!response)
            return;
        // Log logical signals and high-level reasoning
        await (0, firestore_1.updateDoc)(missionRef, {
            intelligenceSignals: response.meta.intelligenceSignals || [],
            lastReasoning: response.meta.reasoning,
            updated_at: (0, firestore_1.serverTimestamp)()
        });
        // Flatten all segments into a single atomic queue
        const stepQueue = response.execution.segments.flatMap(s => s.steps);
        for (const step of stepQueue) {
            console.log(`[Executor] Executing Step: ${step.action} on ${step.targetId} (${step.explanation})`);
            if (step.action === 'wait_for_user' || step.action === 'ask_user') {
                await (0, firestore_1.updateDoc)(missionRef, { status: 'waiting', lastAction: `Waiting: ${step.explanation}` });
                return 'pending';
            }
            if (step.action === 'record_knowledge' && step.value) {
                const targetContext = Object.assign(Object.assign({}, context), (step.knowledgeContext || {}));
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, targetContext, 'rule', step.value);
                await (0, firestore_1.updateDoc)(missionRef, { lastAction: `Stored knowledge: ${step.value.substring(0, 30)}...` });
                // We DON'T continue; we execute the rest of the chain if possible
            }
            if (step.action === 'done') {
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                await (0, firestore_1.updateDoc)(missionRef, { status: 'completed', progress: 100, lastAction: 'Mission Completed Successfully' });
                return 'done';
            }
            let result = 'success';
            let observation = step.explanation;
            try {
                const sel = `[data-ai-id="${step.targetId}"]`;
                // Verification using domContext if provided
                if ((_a = step.domContext) === null || _a === void 0 ? void 0 : _a.tagName) {
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
            await (0, firestore_1.updateDoc)(missionRef, {
                lastAction: observation.substring(0, 100) + '...',
                progress: Math.min((data.progress || 0) + 2, 98), // Incremental progress
                updated_at: (0, firestore_1.serverTimestamp)()
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