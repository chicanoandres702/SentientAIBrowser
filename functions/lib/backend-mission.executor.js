"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionStep = processMissionStep;
// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
const proxy_config_1 = require("./proxy-config");
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const llm_memory_service_1 = require("./features/llm/llm-memory-service");
const knowledge_hierarchy_service_1 = require("./features/llm/knowledge-hierarchy.service");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
async function processMissionStep(missionId) {
    var _a;
    try {
        const missionRef = proxy_config_1.db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'active')
            return;
        const data = snap.data();
        if (data.executingAgent && data.executingAgent !== 'backend') {
            console.log(`[Executor] ⏭ Skipping — frontend has execution lock`);
            return;
        }
        try {
            await missionRef.update({ executingAgent: 'backend', updated_at: new Date().toISOString() });
        }
        catch (_b) {
            console.log(`[Executor] ⏭ Execution lock conflict — skipping cycle`);
            return;
        }
        const { tabId = 'default', userId } = data;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const stepCount = data.stepCount || 0;
        const page = await (0, proxy_page_handler_1.getPersistentPage)(null, tabId, userId);
        if (!page) {
            console.error('[Executor] ❌ getPersistentPage returned null');
            return;
        }
        const currentUrl = page.url();
        const ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
        // Why: quality 30 reduces base64 payload ~40% vs 50, speeds up LLM round-trip
        const screenshot = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
        // Write current URL so UI address bar + lastAction stay live
        await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });
        // ── STAGE 3: LLM decision (re-plan with current ARIA state) ────────────────────
        await missionRef.update({ lastAction: '🤔 Thinking...', updated_at: new Date().toISOString() });
        const response = await (0, llm_decision_engine_1.determineNextAction)(userId, data.goal, [], screenshot, new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot);
        if (!response) {
            console.error('[Executor] ❌ LLM returned null');
            await missionRef.update({ lastAction: '❌ LLM returned no response', updated_at: new Date().toISOString() });
            return;
        }
        await missionRef.update({ intelligenceSignals: response.meta.intelligenceSignals || [], lastReasoning: response.meta.reasoning || '', updated_at: new Date().toISOString() });
        // ── STAGE 4: Execute step queue ──────────────────────────────────────────────
        const stepQueue = response.execution.segments.flatMap(s => s.steps);
        console.log(`[Executor] ✅ LLM planned ${stepQueue.length} steps`);
        // Why: persist the full step list to Firestore BEFORE executing so the frontend
        // MissionCard shows the real task list immediately.
        // We KEEP previously completed/failed tasks and APPEND the new planned ones so the
        // user sees cumulative progress across LLM cycles, not a reset-to-pending on each cycle.
        const existingTasks = (data.tasks || []).filter((t) => t.status === 'completed' || t.status === 'failed');
        const taskDocs = stepQueue.map((step, i) => ({
            id: `step-${Date.now()}-${i}`,
            title: `${step.action}: ${step.explanation}`.substring(0, 80),
            action: step.action,
            status: 'pending',
        }));
        // Why: helper returns a fresh merged snapshot — avoids stale spread capturing old refs
        const liveTasks = () => [...existingTasks, ...taskDocs];
        await missionRef.update({ tasks: liveTasks(), updated_at: new Date().toISOString() });
        for (let idx = 0; idx < stepQueue.length; idx++) {
            const step = stepQueue[idx];
            console.log(`[Executor] ▶ STAGE 4 step — action:${step.action} | ${step.explanation}`);
            // Mark this task in_progress before running it
            taskDocs[idx].status = 'in_progress';
            await missionRef.update({ tasks: liveTasks(), lastAction: `⚙️ ${step.action}: ${step.explanation}`.substring(0, 120), updated_at: new Date().toISOString() });
            if (step.action === 'wait_for_user' || step.action === 'ask_user') {
                await missionRef.update({ status: 'waiting', lastAction: `⏳ Waiting: ${step.explanation}`, tasks: liveTasks() });
                return 'pending';
            }
            if (step.action === 'record_knowledge' && step.value) {
                const targetContext = Object.assign(Object.assign({}, context), (step.knowledgeContext || {}));
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, targetContext, 'rule', step.value);
                taskDocs[idx].status = 'completed';
                await missionRef.update({ tasks: liveTasks(), lastAction: `💾 Stored: ${step.value.substring(0, 50)}`, updated_at: new Date().toISOString() });
                continue; // Why: fully handled — skip executeAriaAction path below
            }
            if (step.action === 'done') {
                await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                taskDocs[idx].status = 'completed';
                await missionRef.update({ status: 'completed', progress: 100, stepCount: stepCount + idx + 1, lastAction: '✅ Mission Completed Successfully', tasks: liveTasks() });
                return 'done';
            }
            let result = 'success';
            let observation = step.explanation;
            try {
                // Why: LLM now returns ARIA role+name selectors (not numeric data-ai-id).
                // Route ALL actions through executeAriaAction which uses page.getByRole/getByText —
                // the same mechanism @playwright/mcp uses. Selectors resolve fresh at call time.
                const actionStr = step.action;
                if (actionStr === 'done' || actionStr === 'wait_for_user' || actionStr === 'ask_user' || actionStr === 'record_knowledge') {
                    // handled above — skip executeAriaAction
                }
                else if (step.action === 'upload_file' && step.value) {
                    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                    const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                    if (!allowed.includes(ext))
                        throw new Error(`File type "${ext}" not permitted`);
                    await page.locator('input[type="file"]').first().setInputFiles(step.value);
                }
                else {
                    await (0, playwright_mcp_adapter_1.executeAriaAction)(page, step);
                }
            }
            catch (err) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
                console.error(`[Executor] ❌ STAGE 4 step FAIL — action:${step.action} | ${err.message}`);
            }
            taskDocs[idx].status = result === 'success' ? 'completed' : 'failed';
            const pageUrlNow = await Promise.resolve().then(() => page.url()).catch(() => currentUrl || 'unknown');
            await (0, llm_memory_service_1.recordActionOutcome)(userId, data.goal, step.action, result, observation, new URL(pageUrlNow || 'http://unknown').hostname).catch(() => { });
            const nextStepCount = stepCount + idx + 1;
            const nextProgress = Math.min(99, Math.round((nextStepCount / (nextStepCount + 8)) * 100));
            await missionRef.update({ tasks: liveTasks(), lastAction: `${result === 'success' ? '✅' : '❌'} ${observation}`.substring(0, 120), progress: nextProgress, stepCount: nextStepCount, updated_at: new Date().toISOString() });
            if (result === 'failure')
                console.warn(`[Executor] ⚠️ step failed but continuing: ${observation}`);
        }
    }
    catch (e) {
        const err = e;
        console.error(`[Executor] 🔥 Fatal: ${err.message}`);
        try {
            await proxy_config_1.db.collection('missions').doc(missionId).update({ lastAction: `🔥 Error: ${err.message}`.substring(0, 120), updated_at: new Date().toISOString() });
        }
        catch (_c) { }
    }
    return 'pending';
}
//# sourceMappingURL=backend-mission.executor.js.map