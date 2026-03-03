// Feature: Mission Tasks | Why: Per-task operations (retry/skip/block-user) + live replanning
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Task operations API — retry, skip, block-user, replan
 * [Subtask] REST endpoints that mutate task_queues docs + trigger mission re-planning
 * [Upstream] MissionCard action buttons -> [Downstream] task_queues Firestore + mission loop
 * [Law Check] 95 lines | Passed 100-Line Law
 */
import { Express } from 'express';
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { getAriaSnapshot } from './playwright-mcp-adapter';
import { getCachedFrame } from './proxy-tab-sync.broker';
import { applyCorsHeaders } from './proxy-route.utils';

export function setupTasksRoute(app: Express): void {
    app.options('/proxy/tasks/:taskId/:op', (_req, res) => { applyCorsHeaders(res); res.sendStatus(204); });
    app.options('/proxy/replan', (_req, res) => { applyCorsHeaders(res); res.sendStatus(204); });

    // POST /proxy/tasks/:taskId/retry — reset failed task → pending + resume mission loop
    app.post('/proxy/tasks/:taskId/retry', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { taskId } = req.params;
        try {
            const ref = db.collection('task_queues').doc(taskId);
            const snap = await ref.get();
            if (!snap.exists) return res.status(404).json({ error: 'task not found' });
            const data = snap.data() as any;
            await ref.update({ status: 'pending', updated_at: new Date().toISOString() });
            // Why: re-activate the parent mission so runMissionLoop picks it up next cycle
            if (data.missionId) {
                const mRef = db.collection('missions').doc(data.missionId);
                const mSnap = await mRef.get();
                if (mSnap.exists && ['waiting', 'paused', 'completed'].includes(mSnap.data()?.status)) {
                    await mRef.update({ status: 'active', updated_at: new Date().toISOString() });
                }
            }
            return res.json({ ok: true, taskId, newStatus: 'pending' });
        } catch (e: unknown) { return res.status(500).json({ error: (e as Error).message }); }
    });

    // POST /proxy/tasks/:taskId/skip — mark a task completed (skipped by user)
    app.post('/proxy/tasks/:taskId/skip', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { taskId } = req.params;
        try {
            await db.collection('task_queues').doc(taskId).update({
                status: 'completed', completedTime: Date.now(), updated_at: new Date().toISOString(),
            });
            return res.json({ ok: true, taskId, newStatus: 'completed' });
        } catch (e: unknown) { return res.status(500).json({ error: (e as Error).message }); }
    });

    // POST /proxy/tasks/:taskId/block-user — pause for user action on this task
    app.post('/proxy/tasks/:taskId/block-user', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { taskId } = req.params;
        try {
            const ref = db.collection('task_queues').doc(taskId);
            const snap = await ref.get();
            if (!snap.exists) return res.status(404).json({ error: 'task not found' });
            const data = snap.data() as any;
            await ref.update({ status: 'blocked_on_user', updated_at: new Date().toISOString() });
            if (data.missionId) {
                await db.collection('missions').doc(data.missionId).update({
                    status: 'waiting', lastAction: `\u270b Waiting for user on: ${data.title || taskId}`,
                    updated_at: new Date().toISOString(),
                });
            }
            return res.json({ ok: true, taskId, newStatus: 'blocked_on_user' });
        } catch (e: unknown) { return res.status(500).json({ error: (e as Error).message }); }
    });

    // POST /proxy/replan — assess current page + append new steps to an active mission
    // Why: lets the user extend a stalled/complete plan without starting a new mission.
    app.post('/proxy/replan', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { missionId, tabId = 'default', userId = 'anonymous', extraInstruction } = req.body;
        if (!missionId) return res.status(400).json({ error: 'missionId required' });
        try {
            const mSnap = await db.collection('missions').doc(missionId).get();
            if (!mSnap.exists) return res.status(404).json({ error: 'mission not found' });
            const mData = mSnap.data() as any;
            const goal = extraInstruction ? `${mData.goal}\n\n[Additional instruction]: ${extraInstruction}` : mData.goal;
            const runtimeApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;
            let domain = 'general'; let ariaSnapshot: string | undefined; let screenshot: string | undefined;
            try {
                const page = await getPersistentPage(null, tabId, userId);
                if (page) {
                    domain = new URL(page.url() || 'http://blank').hostname;
                    ariaSnapshot = await getAriaSnapshot(page);
                    const cf = getCachedFrame(tabId);
                    screenshot = cf ? cf.data.replace('data:image/jpeg;base64,', '') : (await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })).toString('base64');
                }
            } catch { /* page unavailable — plan from goal text only */ }
            const response = await determineNextAction(userId, goal, [], screenshot, domain, [], false, undefined, ariaSnapshot, runtimeApiKey);
            if (!response) return res.status(500).json({ error: 'LLM returned no response' });
            const newSteps = response.execution.segments.flatMap((s: any) => s.steps) as any[];
            // Append new task_queues docs for the freshly planned steps
            const existingSnap = await db.collection('task_queues').where('missionId', '==', missionId).orderBy('order', 'desc').limit(1).get();
            const maxOrder = existingSnap.empty ? 0 : ((existingSnap.docs[0].data() as any).order || 0);
            const batch = db.batch();
            newSteps.forEach((step, i) => {
                const docRef = db.collection('task_queues').doc(`replan-${missionId}-${Date.now()}-${i}`);
                batch.set(docRef, { missionId, tabId, userId, title: `${step.action}: ${step.explanation}`.substring(0, 80), action: step.action, explanation: step.explanation, status: 'pending', order: maxOrder + i + 1, timestamp: Date.now(), source: 'planner' });
            });
            await batch.commit();
            // Re-activate mission if it was waiting/completed
            if (['waiting', 'paused', 'completed'].includes(mData.status)) {
                await db.collection('missions').doc(missionId).update({ status: 'active', updated_at: new Date().toISOString() });
            }
            return res.json({ ok: true, addedSteps: newSteps.length });
        } catch (e: unknown) { return res.status(500).json({ error: (e as Error).message }); }
    });
}
