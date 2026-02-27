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
        const screenshot = await page.screenshot({ encoding: 'base64', quality: 50, type: 'jpeg' });
        const decision = await (0, llm_decision_engine_1.determineNextAction)(data.goal, domMap, screenshot, new URL(page.url()).hostname, [], true, context);
        if (!decision)
            return;
        if (decision.action === 'record_knowledge' && decision.value) {
            await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'rule', decision.value);
            await (0, firestore_1.updateDoc)(missionRef, { lastAction: `Saved knowledge: ${decision.value.substring(0, 30)}...` });
            return;
        }
        let result = 'success';
        let observation = decision.reasoning;
        try {
            const sel = `[data-ai-id="${decision.targetId}"]`;
            if (decision.action === 'click')
                await page.click(sel, { timeout: 8000 });
            else if (decision.action === 'type' && decision.value) {
                await page.fill(sel, decision.value);
                await page.keyboard.press('Enter');
            }
            else if (decision.action === 'done') {
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                await (0, firestore_1.updateDoc)(missionRef, { status: 'completed', progress: 100 });
                return 'done';
            }
        }
        catch (err) {
            result = 'failure';
            observation = `Action failed: ${err.message}`;
        }
        await (0, llm_memory_service_1.recordActionOutcome)(userId, data.goal, decision.action, result, observation, new URL(page.url()).hostname);
        await (0, firestore_1.updateDoc)(missionRef, {
            lastAction: observation.substring(0, 100) + '...',
            progress: Math.min((data.progress || 0) + 5, 95),
            updated_at: (0, firestore_1.serverTimestamp)()
        });
    }
    catch (e) {
        console.error(`[Executor] Fatal in mission ${missionId}:`, e.message);
    }
}
//# sourceMappingURL=backend-mission.executor.js.map