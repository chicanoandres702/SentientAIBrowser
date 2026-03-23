"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTasksRoute = setupTasksRoute;
const proxy_config_1 = require("./proxy-config");
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
const proxy_route_utils_1 = require("./proxy-route.utils");
function setupTasksRoute(app) {
    app.options('/proxy/tasks/:taskId/:op', (_req, res) => { (0, proxy_route_utils_1.applyCorsHeaders)(res); res.sendStatus(204); });
    app.options('/proxy/replan', (_req, res) => { (0, proxy_route_utils_1.applyCorsHeaders)(res); res.sendStatus(204); });
    // POST /proxy/tasks/:taskId/retry — reset failed task → pending + resume mission loop
    app.post('/proxy/tasks/:taskId/retry', async (req, res) => {
        var _a;
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { taskId } = req.params;
        try {
            const ref = proxy_config_1.db.collection('task_queues').doc(taskId);
            const snap = await ref.get();
            if (!snap.exists)
                return res.status(404).json({ error: 'task not found' });
            const data = snap.data();
            await ref.update({ status: 'pending', updated_at: new Date().toISOString() });
            // Why: re-activate the parent mission so runMissionLoop picks it up next cycle
            if (data.missionId) {
                const mRef = proxy_config_1.db.collection('missions').doc(data.missionId);
                const mSnap = await mRef.get();
                if (mSnap.exists && ['waiting', 'paused', 'completed'].includes((_a = mSnap.data()) === null || _a === void 0 ? void 0 : _a.status)) {
                    await mRef.update({ status: 'active', updated_at: new Date().toISOString() });
                }
            }
            return res.json({ ok: true, taskId, newStatus: 'pending' });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    // POST /proxy/tasks/:taskId/skip — mark a task completed (skipped by user)
    app.post('/proxy/tasks/:taskId/skip', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { taskId } = req.params;
        try {
            await proxy_config_1.db.collection('task_queues').doc(taskId).update({
                status: 'completed', completedTime: Date.now(), updated_at: new Date().toISOString(),
            });
            return res.json({ ok: true, taskId, newStatus: 'completed' });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    // POST /proxy/tasks/:taskId/block-user — pause for user action on this task
    app.post('/proxy/tasks/:taskId/block-user', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { taskId } = req.params;
        try {
            const ref = proxy_config_1.db.collection('task_queues').doc(taskId);
            const snap = await ref.get();
            if (!snap.exists)
                return res.status(404).json({ error: 'task not found' });
            const data = snap.data();
            await ref.update({ status: 'blocked_on_user', updated_at: new Date().toISOString() });
            if (data.missionId) {
                await proxy_config_1.db.collection('missions').doc(data.missionId).update({
                    status: 'waiting', lastAction: `\u270b Waiting for user on: ${data.title || taskId}`,
                    updated_at: new Date().toISOString(),
                });
            }
            return res.json({ ok: true, taskId, newStatus: 'blocked_on_user' });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
    // POST /proxy/replan — assess current page + append new steps to an active mission
    // Why: lets the user extend a stalled/complete plan without starting a new mission.
    app.post('/proxy/replan', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { missionId, tabId = 'default', userId = 'anonymous', extraInstruction } = req.body;
        if (!missionId)
            return res.status(400).json({ error: 'missionId required' });
        try {
            const mSnap = await proxy_config_1.db.collection('missions').doc(missionId).get();
            if (!mSnap.exists)
                return res.status(404).json({ error: 'mission not found' });
            const mData = mSnap.data();
            const goal = extraInstruction ? `${mData.goal}\n\n[Additional instruction]: ${extraInstruction}` : mData.goal;
            const runtimeApiKey = req.headers['x-gemini-api-key'] || undefined;
            let domain = 'general';
            let ariaSnapshot;
            let screenshot;
            try {
                const page = await (0, proxy_page_handler_1.getPersistentPage)(null, tabId, userId);
                if (page) {
                    domain = new URL(page.url() || 'http://blank').hostname;
                    ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
                    const cf = (0, proxy_tab_sync_broker_1.getCachedFrame)(tabId);
                    screenshot = cf ? cf.data.replace('data:image/jpeg;base64,', '') : (await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })).toString('base64');
                }
            }
            catch ( /* page unavailable — plan from goal text only */_a) { /* page unavailable — plan from goal text only */ }
            const response = await (0, llm_decision_engine_1.determineNextAction)(userId, goal, [], screenshot, domain, [], false, undefined, ariaSnapshot, runtimeApiKey);
            if (!response)
                return res.status(500).json({ error: 'LLM returned no response' });
            const newSteps = response.execution.segments.flatMap((s) => s.steps);
            // Append new task_queues docs for the freshly planned steps
            const existingSnap = await proxy_config_1.db.collection('task_queues').where('missionId', '==', missionId).orderBy('order', 'desc').limit(1).get();
            const maxOrder = existingSnap.empty ? 0 : (existingSnap.docs[0].data().order || 0);
            const batch = proxy_config_1.db.batch();
            newSteps.forEach((step, i) => {
                const docRef = proxy_config_1.db.collection('task_queues').doc(`replan-${missionId}-${Date.now()}-${i}`);
                batch.set(docRef, { missionId, tabId, userId, title: `${step.action}: ${step.explanation}`.substring(0, 80), action: step.action, explanation: step.explanation, status: 'pending', order: maxOrder + i + 1, timestamp: Date.now(), source: 'planner' });
            });
            await batch.commit();
            // Re-activate mission if it was waiting/completed
            if (['waiting', 'paused', 'completed'].includes(mData.status)) {
                await proxy_config_1.db.collection('missions').doc(missionId).update({ status: 'active', updated_at: new Date().toISOString() });
            }
            return res.json({ ok: true, addedSteps: newSteps.length });
        }
        catch (e) {
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-tasks.js.map