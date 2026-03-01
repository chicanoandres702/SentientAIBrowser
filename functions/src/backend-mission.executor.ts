// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
// Technique: Playwright MCP — ARIA snapshots replace data-ai-id indices; role+name selectors
// are stable across DOM mutations. Technique sourced from @playwright/mcp architecture.
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';
import { getAriaSnapshot } from './playwright-mcp-adapter';
import { MissionStep } from './features/llm/llm-decision.engine';
import { executeStepWithRetry } from './step-executor';
import { findSegmentTaskId, setSubActionStatus, completeSegmentTask, failSegmentTask } from './task-queue-bridge';

// Why: No automatic stop conditions — the mission runs until:
//   (a) The LLM emits action 'done'  →  status set to 'completed'
//   (b) The user manually sets status ≠ 'active' in Firestore
// Step failures are retried (see step-executor.ts) before marking failed.

export async function processMissionStep(missionId: string) {
    try {
        // ── STAGE 1: Load mission ─────────────────────────────────────────────────
        const missionRef = db.collection('missions').doc(missionId);
        const snap = await missionRef.get();
        if (!snap.exists || snap.data()?.status !== 'active') return;
        const data = snap.data()!;
        const { tabId = 'default', userId } = data;
        const useConfirmerAgent: boolean = data.useConfirmerAgent ?? true;
        const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
        const stepCount: number = data.stepCount || 0;
        console.log(`[Executor] ▶ mission: "${data.goal}" | tab: ${tabId}`);

        // ── STAGE 2: Page + ARIA + screenshot ────────────────────────────────────
        const page = await getPersistentPage(null, tabId, userId);
        if (!page) { console.error('[Executor] ❌ getPersistentPage returned null'); return; }
        const currentUrl = page.url();
        const ariaSnapshot = await getAriaSnapshot(page);
        const screenshot = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
        await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });

        // ── STAGE 3: LLM decision ────────────────────────────────────────────────
        await missionRef.update({ lastAction: '🧠 Thinking...', updated_at: new Date().toISOString() });
        const response = await determineNextAction(userId, data.goal, [], screenshot,
            new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot);
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
            const steps: MissionStep[] = seg.steps || [];
            // Why: segOrder matches the `order` field set by buildMissionFromSegments (order: i+1)
            const segOrder = segIdx + 1;
            const taskDocId = await findSegmentTaskId(missionId, segOrder).catch(() => null);
            let segFailed = false;

            for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
                const step = steps[stepIdx];
                await missionRef.update({ lastAction: `⚙️ ${step.action}: ${step.explanation}`.substring(0, 120), updated_at: new Date().toISOString() });
                if (taskDocId) await setSubActionStatus(taskDocId, stepIdx, 'in_progress').catch(() => {});

                // Special actions handled without Playwright
                if (step.action === 'done') {
                    await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                    if (taskDocId) await completeSegmentTask(taskDocId, missionId, segOrder).catch(() => {});
                    await missionRef.update({ status: 'completed', progress: 100, stepCount: globalStepCount, lastAction: '✅ Mission Completed Successfully', updated_at: new Date().toISOString() });
                    return 'done';
                }
                if (step.action === 'wait_for_user' || step.action === 'ask_user') {
                    await missionRef.update({ status: 'waiting', lastAction: `⏳ Waiting: ${step.explanation}`, updated_at: new Date().toISOString() });
                    return 'pending';
                }
                if (step.action === 'record_knowledge' && step.value) {
                    await saveContextualKnowledge(userId, { ...context, ...((step as any).knowledgeContext || {}) }, 'rule', step.value);
                    if (taskDocId) await setSubActionStatus(taskDocId, stepIdx, 'completed').catch(() => {});
                    await missionRef.update({ lastAction: `💾 Stored: ${step.value.substring(0, 50)}`, updated_at: new Date().toISOString() });
                    continue;
                }

                // Why: executeStepWithRetry attempts up to 2 times with post-action verification
                const { result, observation } = await executeStepWithRetry(page, step, useConfirmerAgent);
                globalStepCount++;
                if (taskDocId) await setSubActionStatus(taskDocId, stepIdx, result === 'success' ? 'completed' : 'failed').catch(() => {});
                if (result === 'failure') segFailed = true;

                const pageUrl = await Promise.resolve().then(() => page.url()).catch(() => currentUrl);
                await recordActionOutcome(userId, data.goal, step.action, result, observation, new URL(pageUrl || 'http://unknown').hostname).catch(() => {});
                const progress = Math.min(99, Math.round((globalStepCount / (globalStepCount + 8)) * 100));
                await missionRef.update({ lastAction: `${result === 'success' ? '✅' : '❌'} ${observation}`.substring(0, 120), progress, stepCount: globalStepCount, updated_at: new Date().toISOString() });
            }

            // Mark segment task complete or failed in task_queues so frontend advances
            if (taskDocId) {
                if (segFailed) await failSegmentTask(taskDocId).catch(() => {});
                else await completeSegmentTask(taskDocId, missionId, segOrder).catch(() => {});
            }
        }
    } catch (e: any) {
        console.error(`[Executor] 🔥 FATAL ${missionId}: ${e.message}`);
        try { await db.collection('missions').doc(missionId).update({ lastAction: `🔥 Fatal: ${e.message}`.substring(0, 120), updated_at: new Date().toISOString() }); } catch {}
    }
    return 'pending';
}

