"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionStep = processMissionStep;
// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
// Technique: Playwright MCP — ARIA snapshots replace data-ai-id indices; role+name selectors
// are stable across DOM mutations. Technique sourced from @playwright/mcp architecture.
const proxy_config_1 = require("./proxy-config");
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const llm_memory_service_1 = require("./features/llm/llm-memory-service");
const knowledge_hierarchy_service_1 = require("./features/llm/knowledge-hierarchy.service");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const step_executor_1 = require("./step-executor");
const task_queue_bridge_1 = require("./task-queue-bridge");
// Why: No automatic stop conditions — the mission runs until:
//   (a) The LLM emits action 'done'  →  status set to 'completed'
//   (b) The user manually sets status ≠ 'active' in Firestore
// Step failures are retried (see step-executor.ts) before marking failed.
async function processMissionStep(missionId) {
    var _a, _b;
    try {
        // ── STAGE 1: Load mission ─────────────────────────────────────────────────
        const missionRef = proxy_config_1.db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'active')
            return;
        const data = snap.data();
        const { tabId = 'default', userId } = data;
        const useConfirmerAgent = (_b = data.useConfirmerAgent) !== null && _b !== void 0 ? _b : true;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const stepCount = data.stepCount || 0;
        console.log(`[Executor] ▶ mission: "${data.goal}" | tab: ${tabId}`);
        // ── STAGE 2: Page + ARIA + screenshot ────────────────────────────────────
        const page = await (0, proxy_page_handler_1.getPersistentPage)(null, tabId, userId);
        if (!page) {
            console.error('[Executor] ❌ getPersistentPage returned null');
            return;
        }
        const currentUrl = page.url();
        const ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
        const screenshot = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
        await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });
        // ── STAGE 3: LLM decision ────────────────────────────────────────────────
        await missionRef.update({ lastAction: '🧠 Thinking...', updated_at: new Date().toISOString() });
        const response = await (0, llm_decision_engine_1.determineNextAction)(userId, data.goal, [], screenshot, new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot);
        if (!response) {
            await missionRef.update({ lastAction: '❌ LLM returned no response — check API key', updated_at: new Date().toISOString() });
            return;
        }
        await missionRef.update({ intelligenceSignals: response.meta.intelligenceSignals || [], lastReasoning: response.meta.reasoning, updated_at: new Date().toISOString() });
        // ── STAGE 4: Execute per-segment — bridge completions to task_queues ──────
        // Why: iterate segments (not flat steps) so each segment's task_queues doc
        // can be updated with subAction-level granularity as each step completes.
        const segments = response.execution.segments;
        console.log(`[Executor] ✅ LLM done — ${segments.length} segments | ▶ executing...`);
        let globalStepCount = stepCount;
        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
            const seg = segments[segIdx];
            const steps = seg.steps || [];
            // Why: segOrder matches the `order` field set by buildMissionFromSegments (order: i+1)
            const segOrder = segIdx + 1;
            const taskDocId = await (0, task_queue_bridge_1.findSegmentTaskId)(missionId, segOrder).catch(() => null);
            let segFailed = false;
            for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
                const step = steps[stepIdx];
                await missionRef.update({ lastAction: `⚙️ ${step.action}: ${step.explanation}`.substring(0, 120), updated_at: new Date().toISOString() });
                if (taskDocId)
                    await (0, task_queue_bridge_1.setSubActionStatus)(taskDocId, stepIdx, 'in_progress').catch(() => { });
                // Special actions handled without Playwright
                if (step.action === 'done') {
                    await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                    if (taskDocId)
                        await (0, task_queue_bridge_1.completeSegmentTask)(taskDocId, missionId, segOrder).catch(() => { });
                    await missionRef.update({ status: 'completed', progress: 100, stepCount: globalStepCount, lastAction: '✅ Mission Completed Successfully', updated_at: new Date().toISOString() });
                    return 'done';
                }
                if (step.action === 'wait_for_user' || step.action === 'ask_user') {
                    await missionRef.update({ status: 'waiting', lastAction: `⏳ Waiting: ${step.explanation}`, updated_at: new Date().toISOString() });
                    return 'pending';
                }
                if (step.action === 'record_knowledge' && step.value) {
                    await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, Object.assign(Object.assign({}, context), (step.knowledgeContext || {})), 'rule', step.value);
                    if (taskDocId)
                        await (0, task_queue_bridge_1.setSubActionStatus)(taskDocId, stepIdx, 'completed').catch(() => { });
                    await missionRef.update({ lastAction: `💾 Stored: ${step.value.substring(0, 50)}`, updated_at: new Date().toISOString() });
                    continue;
                }
                // Why: executeStepWithRetry attempts up to 2 times with post-action verification
                const { result, observation } = await (0, step_executor_1.executeStepWithRetry)(page, step, useConfirmerAgent);
                globalStepCount++;
                if (taskDocId)
                    await (0, task_queue_bridge_1.setSubActionStatus)(taskDocId, stepIdx, result === 'success' ? 'completed' : 'failed').catch(() => { });
                if (result === 'failure')
                    segFailed = true;
                const pageUrl = await Promise.resolve().then(() => page.url()).catch(() => currentUrl);
                await (0, llm_memory_service_1.recordActionOutcome)(userId, data.goal, step.action, result, observation, new URL(pageUrl || 'http://unknown').hostname).catch(() => { });
                const progress = Math.min(99, Math.round((globalStepCount / (globalStepCount + 8)) * 100));
                await missionRef.update({ lastAction: `${result === 'success' ? '✅' : '❌'} ${observation}`.substring(0, 120), progress, stepCount: globalStepCount, updated_at: new Date().toISOString() });
            }
            // Mark segment task complete or failed in task_queues so frontend advances
            if (taskDocId) {
                if (segFailed)
                    await (0, task_queue_bridge_1.failSegmentTask)(taskDocId).catch(() => { });
                else
                    await (0, task_queue_bridge_1.completeSegmentTask)(taskDocId, missionId, segOrder).catch(() => { });
            }
        }
    }
    catch (e) {
        console.error(`[Executor] 🔥 FATAL ${missionId}: ${e.message}`);
        try {
            await proxy_config_1.db.collection('missions').doc(missionId).update({ lastAction: `🔥 Fatal: ${e.message}`.substring(0, 120), updated_at: new Date().toISOString() });
        }
        catch (_c) { }
    }
    return 'pending';
}
//# sourceMappingURL=backend-mission.executor.js.map