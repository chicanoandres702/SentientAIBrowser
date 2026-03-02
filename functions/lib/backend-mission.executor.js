"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMissionStep = processMissionStep;
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
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const api_key_resolver_1 = require("./features/llm/api-key.resolver");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
const backend_step_executor_1 = require("./backend-step.executor");
async function processMissionStep(missionId) {
    var _a;
    try {
        const missionRef = proxy_config_1.db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'active')
            return;
        const data = snap.data();
        // Why: frontend may hold execution lock (e.g. manual user action). Yield immediately.
        if (data.executingAgent && data.executingAgent !== 'backend') {
            console.log('[Executor] ⏭ Skipping — non-backend agent has execution lock');
            return;
        }
        try {
            await missionRef.update({ executingAgent: 'backend', updated_at: new Date().toISOString() });
        }
        catch (_b) {
            console.log('[Executor] ⏭ Execution lock conflict — skipping cycle');
            return;
        }
        const { tabId = 'default', userId } = data;
        const apiKey = data.runtimeApiKey || await (0, api_key_resolver_1.resolveGeminiApiKey)(userId);
        if (!apiKey) {
            (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '❌ No Gemini API key — set one in Settings');
            await missionRef.update({ lastAction: '❌ No Gemini API key — add one in Settings > LLM OVERRIDE', updated_at: new Date().toISOString() });
            return;
        }
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const stepCount = data.stepCount || 0;
        const startUrl = (data.tabUrl && data.tabUrl !== 'about:blank') ? data.tabUrl : null;
        const page = await (0, proxy_page_handler_1.getPersistentPage)(startUrl, tabId, userId);
        if (!page) {
            console.error('[Executor] ❌ getPersistentPage returned null');
            return;
        }
        const currentUrl = page.url();
        if ((0, proxy_nav_controller_1.isBotCheckUrl)(currentUrl)) {
            (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '🤖 Bot check detected — complete then resume');
            await missionRef.update({ status: 'waiting', lastAction: '🤖 Bot check / CAPTCHA — complete in browser then resume', updated_at: new Date().toISOString() });
            return 'pending';
        }
        if ((0, proxy_nav_controller_1.isAuthWallUrl)(currentUrl)) {
            (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '🔐 Auth required — complete login then resume');
            // Why: persist pre-auth returnUrl so resume navigates to original dest, not the expired SAML/SSO URL
            const returnUrl = data.authWallReturnUrl || startUrl || currentUrl;
            await missionRef.update({ status: 'waiting', lastAction: '🔐 Auth / MFA required — complete login then resume', currentUrl, authWallReturnUrl: returnUrl, updated_at: new Date().toISOString() });
            return 'pending';
        }
        const prevUrl = data.lastExecutorUrl;
        const sameCount = (prevUrl === currentUrl) ? ((data.sameUrlCycles || 0) + 1) : 0;
        await missionRef.update({ lastExecutorUrl: currentUrl, sameUrlCycles: sameCount, updated_at: new Date().toISOString() });
        if (sameCount >= 4) {
            (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, `🔁 Stuck at ${new URL(currentUrl || 'http://x').hostname} — check and resume`);
            await missionRef.update({ status: 'waiting', lastAction: `🔁 Redirect loop at ${new URL(currentUrl || 'http://x').hostname} — check the page and resume`, sameUrlCycles: 0, updated_at: new Date().toISOString() });
            return 'pending';
        }
        const ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
        const screenshot = await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })
            .then(buf => buf.toString('base64'))
            .catch(() => { console.warn('[Executor] ⏱ screenshot timeout — proceeding with ARIA only'); return ''; });
        await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });
        (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '🤔 Thinking...');
        await missionRef.update({ lastAction: '🤔 Thinking...', updated_at: new Date().toISOString() });
        const response = await (0, llm_decision_engine_1.determineNextAction)(userId, data.goal, [], screenshot, new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot, apiKey);
        if (!response) {
            await missionRef.update({ lastAction: '❌ LLM returned no response', updated_at: new Date().toISOString() });
            return;
        }
        await missionRef.update({ intelligenceSignals: response.meta.intelligenceSignals || [], lastReasoning: response.meta.reasoning || '', updated_at: new Date().toISOString() });
        const stepQueue = response.execution.segments.flatMap((s) => s.steps);
        const existingTasks = (data.tasks || []).filter((t) => t.status === 'completed' || t.status === 'failed');
        const taskDocs = stepQueue.map((step, i) => ({
            id: `step-${Date.now()}-${i}`, action: step.action, explanation: step.explanation,
            title: `${step.action}: ${step.explanation}`.substring(0, 80), status: 'pending',
        }));
        await missionRef.update({ tasks: [...existingTasks, ...taskDocs], updated_at: new Date().toISOString() });
        return await (0, backend_step_executor_1.executeStepQueue)(page, stepQueue, taskDocs, existingTasks, missionRef, data, context, stepCount, tabId, userId);
    }
    catch (e) {
        const msg = e.message;
        console.error(`[Executor] 🔥 Fatal: ${msg}`);
        try {
            await proxy_config_1.db.collection('missions').doc(missionId).update({ lastAction: `🔥 Error: ${msg}`.substring(0, 120), updated_at: new Date().toISOString() });
        }
        catch (_c) { }
    }
    return 'pending';
}
//# sourceMappingURL=backend-mission.executor.js.map