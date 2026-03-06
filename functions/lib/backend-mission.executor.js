"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionStep = processMissionStep;
/**
 * Sentient File Header
 * Why: Mission executor orchestration shell for Sentient AI Browser
 * Filepath: functions/src/backend-mission.executor.ts
 * Description: Orchestrates mission execution, delegates step queue, broadcasts state
 * Trace: Used by backend, orchestrator, and mission executor modules
 * Wiring: Exported function, consumed by backend and orchestrator
 */
// Feature: Mission Executor | Why: Orchestration shell — guards, ARIA snapshot, LLM call.
// Step execution is delegated to backend-step.executor (100-Line Law).
// Every state transition broadcasts over WebSocket for sub-100ms UI feedback.
/*
 * [Parent Feature/Milestone] Backend Execution
 * [Child Task/Issue] Slim mission orchestrator post step-executor extraction
 * [Subtask] Guards + LLM + task doc bootstrap; delegates loop to executeStepQueue
 * [Upstream] BackendAIOrchestrator -> [Downstream] executeStepQueue + Firestore + WS
 * [Law Check] 78 lines | Passed 100-Line Law
 */
const proxy_config_1 = require("./proxy-config");
const sentientLogger_1 = require("./core/sentientLogger");
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const backend_step_executor_1 = require("./backend-step.executor");
const mission_agent_lock_1 = require("./mission-agent-lock");
const mission_status_checks_1 = require("./mission-status-checks");
const mission_snapshot_1 = require("./mission-snapshot");
const mission_step_queue_1 = require("./mission-step-queue");
async function processMissionStep(missionId) {
    var _a;
    try {
        const missionRef = proxy_config_1.db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'active')
            return;
        const data = snap.data();
        // Agent lock
        if (!await (0, mission_agent_lock_1.acquireBackendAgentLock)(missionRef, data))
            return;
        const { tabId = 'default', userId } = data;
        // API key resolution
        const apiKey = await (0, mission_agent_lock_1.resolveMissionApiKey)(data, userId, tabId, missionRef);
        if (!apiKey)
            return;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const stepCount = data.stepCount || 0;
        const startUrl = (data.tabUrl && data.tabUrl !== 'about:blank') ? data.tabUrl : null;
        const page = await (0, proxy_page_handler_1.getPersistentPage)(startUrl, tabId, userId);
        if (!page) {
            sentientLogger_1.sentientLogger.error('[Executor] ❌ getPersistentPage returned null');
            return;
        }
        const currentUrl = page.url();
        // URL checks
        const urlCheckResult = await (0, mission_status_checks_1.handleUrlChecks)(currentUrl, tabId, missionRef, data, startUrl);
        if (urlCheckResult)
            return urlCheckResult;
        // Stuck URL loop detection
        const prevUrl = data.lastExecutorUrl;
        const sameCount = (prevUrl === currentUrl) ? ((data.sameUrlCycles || 0) + 1) : 0;
        await missionRef.update({ lastExecutorUrl: currentUrl, sameUrlCycles: sameCount, updated_at: new Date().toISOString() });
        if (sameCount >= 4) {
            const host = new URL(currentUrl || 'http://x').hostname;
            await missionRef.update({ status: 'waiting', lastAction: `🔁 Redirect loop at ${host} — check the page and resume`, sameUrlCycles: 0, updated_at: new Date().toISOString() });
            return 'pending';
        }
        // ARIA snapshot and screenshot
        const { ariaSnapshot, screenshot } = await (0, mission_snapshot_1.getMissionSnapshot)(page, tabId);
        await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });
        await missionRef.update({ lastAction: '🤔 Thinking...', updated_at: new Date().toISOString() });
        // LLM decision
        const response = await (0, llm_decision_engine_1.determineNextAction)(userId, data.goal, [], screenshot, new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot, apiKey);
        if (!response) {
            await missionRef.update({ lastAction: '❌ LLM returned no response', updated_at: new Date().toISOString() });
            return;
        }
        await missionRef.update({ intelligenceSignals: response.meta.intelligenceSignals || [], lastReasoning: response.meta.reasoning || '', updated_at: new Date().toISOString() });
        // Step queue and task docs
        const stepQueue = response.execution.segments.flatMap((s) => s.steps);
        const existingTasks = (data.tasks || []).filter((t) => t.status === 'completed' || t.status === 'failed');
        const taskDocs = (0, mission_step_queue_1.createTaskDocs)(stepQueue);
        await missionRef.update({ tasks: [...existingTasks, ...taskDocs], updated_at: new Date().toISOString() });
        return await (0, backend_step_executor_1.executeStepQueue)(page, stepQueue, taskDocs, existingTasks, missionRef, data, context, stepCount, tabId, userId);
    }
    catch (e) {
        const msg = e.message;
        sentientLogger_1.sentientLogger.error(`[Executor] 🔥 Fatal: ${msg}`);
        try {
            await proxy_config_1.db.collection('missions').doc(missionId).update({ lastAction: `🔥 Error: ${msg}`.substring(0, 120), updated_at: new Date().toISOString() });
        }
        catch (_b) { }
    }
    return 'pending';
}
//# sourceMappingURL=backend-mission.executor.js.map