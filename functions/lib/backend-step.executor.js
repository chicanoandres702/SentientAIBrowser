"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeStepQueue = executeStepQueue;
const llm_memory_service_1 = require("./features/llm/llm-memory-service");
const knowledge_hierarchy_service_1 = require("./features/llm/knowledge-hierarchy.service");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
async function executeStepQueue(page, stepQueue, taskDocs, existingTasks, missionRef, data, context, stepCount, tabId, userId) {
    var _a, _b, _c;
    const live = () => [...existingTasks, ...taskDocs];
    for (let idx = 0; idx < stepQueue.length; idx++) {
        const step = stepQueue[idx];
        taskDocs[idx].status = 'in_progress';
        const label = `${step.action}: ${(_a = step.explanation) !== null && _a !== void 0 ? _a : ''}`;
        (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, `⚙️ ${label}`.substring(0, 80));
        await missionRef.update({ tasks: live(), lastAction: `⚙️ ${label}`.substring(0, 120), updated_at: new Date().toISOString() });
        if (step.action === 'wait_for_user' || step.action === 'ask_user') {
            (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, `⏳ Waiting: ${(_b = step.explanation) !== null && _b !== void 0 ? _b : ''}`);
            await missionRef.update({ status: 'waiting', lastAction: `⏳ Waiting: ${step.explanation}`, tasks: live() });
            return 'pending';
        }
        if (step.action === 'record_knowledge' && step.value) {
            const kctx = Object.assign(Object.assign({}, context), (step.knowledgeContext || {}));
            await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, kctx, 'rule', step.value);
            taskDocs[idx].status = 'completed';
            await missionRef.update({ tasks: live(), lastAction: `💾 Stored: ${step.value.substring(0, 50)}`, updated_at: new Date().toISOString() });
            continue;
        }
        if (step.action === 'done') {
            await (0, knowledge_hierarchy_service_1.saveContextualKnowledge)(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
            taskDocs[idx].status = 'completed';
            (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '✅ Mission complete');
            await missionRef.update({ status: 'completed', progress: 100, stepCount: stepCount + idx + 1, lastAction: '✅ Mission Completed Successfully', tasks: live() });
            return 'done';
        }
        let result = 'success';
        let observation = (_c = step.explanation) !== null && _c !== void 0 ? _c : step.action;
        try {
            if (['done', 'wait_for_user', 'ask_user', 'record_knowledge'].includes(step.action)) {
                // handled above — no executeAriaAction needed
            }
            else if (step.action === 'upload_file' && step.value) {
                const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                if (!allowed.includes(ext))
                    throw new Error(`File type "${ext}" not permitted`);
                await page.locator('input[type="file"]').first().setInputFiles(step.value);
            }
            else if (step.action === 'navigate' && step.url && /^https?:\/\/(www\.)?(google|bing|yahoo|duckduckgo)\.com\/?(\?.*)?$/.test(step.url) && !step.url.includes('search?') && !step.url.includes('q=')) {
                throw new Error(`Direct nav to ${step.url} blocked — use target URL directly`);
            }
            else {
                await (0, playwright_mcp_adapter_1.executeAriaAction)(page, step);
            }
        }
        catch (err) {
            result = 'failure';
            observation = `Action failed: ${err.message}`;
            console.error(`[StepExecutor] ❌ ${step.action} | ${err.message}`);
        }
        taskDocs[idx].status = result === 'success' ? 'completed' : 'failed';
        const pageUrl = await Promise.resolve().then(() => page.url()).catch(() => { var _a; return String((_a = data.currentUrl) !== null && _a !== void 0 ? _a : 'unknown'); });
        await (0, llm_memory_service_1.recordActionOutcome)(userId, String(data.goal), step.action, result, observation, new URL(pageUrl || 'http://unknown').hostname).catch(() => { });
        const n = stepCount + idx + 1;
        await missionRef.update({ tasks: live(), lastAction: `${result === 'success' ? '✅' : '❌'} ${observation}`.substring(0, 120), progress: Math.min(99, Math.round((n / (n + 8)) * 100)), stepCount: n, updated_at: new Date().toISOString() });
        if (result === 'failure')
            console.warn(`[StepExecutor] ⚠️ step failed but continuing: ${observation}`);
    }
    return 'pending';
}
//# sourceMappingURL=backend-step.executor.js.map