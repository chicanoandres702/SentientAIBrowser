// Feature: Mission Executor | Why: Step-queue runner extracted (100-Line Law).
// Owns the for-loop over ARIA steps. processMissionStep delegates here after planning.
// Broadcasts each step state over WebSocket so the UI reacts in <10ms (no Firestore lag).
/*
 * [Parent Feature/Milestone] Backend Execution
 * [Child Task/Issue] Step executor extracted from processMissionStep
 * [Subtask] Per-step ARIA execution, outcome recording, broadcastStatus at each state
 * [Upstream] processMissionStep -> [Downstream] Playwright page + Firestore + WS broker
 * [Law Check] 84 lines | Passed 100-Line Law
 */
import { Page } from 'playwright';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';
import { executeAriaAction, AriaStep } from './playwright-mcp-adapter';
import { broadcastStatus, broadcastTaskStatus } from './proxy-tab-sync.broker';
import { findCurrentSegmentTask, setSubActionStatus, completeSegmentTask } from './task-queue-bridge';

type DocRef = { update: (data: Record<string, unknown>) => Promise<unknown> };
type MissionCtx = { groupId: string; contextId: string; unitId: string };

export async function executeStepQueue(
    page: Page,
    stepQueue: AriaStep[],
    taskDocs: Array<{ id: string; action: string; explanation?: string; status: string }>,
    existingTasks: unknown[],
    missionRef: DocRef,
    data: Record<string, unknown>,
    context: MissionCtx,
    stepCount: number,
    tabId: string,
    userId: string,
): Promise<'done' | 'pending'> {
    const live = () => [...existingTasks, ...taskDocs];
    // Why: locate the current task_queues card so backend advances it alongside execution
    const segTask = await findCurrentSegmentTask(context.unitId).catch(() => null);
    const segDocId = segTask?.id ?? null;
    const segOrder = segTask?.order ?? 0;

    for (let idx = 0; idx < stepQueue.length; idx++) {
        const step = stepQueue[idx];
        taskDocs[idx].status = 'in_progress';
        if (segDocId) setSubActionStatus(segDocId, idx, 'in_progress').catch(() => {});
        if (segDocId) broadcastTaskStatus(tabId, segDocId, 'in_progress');
        const label = `${step.action}: ${step.explanation ?? ''}`;
        broadcastStatus(tabId, `⚙️ ${label}`.substring(0, 80));
        await missionRef.update({ tasks: live(), lastAction: `⚙️ ${label}`.substring(0, 120), updated_at: new Date().toISOString() });

        if (step.action === 'wait_for_user' || step.action === 'ask_user') {
            broadcastStatus(tabId, `⏳ Waiting: ${step.explanation ?? ''}`);
            await missionRef.update({ status: 'waiting', lastAction: `⏳ Waiting: ${step.explanation}`, tasks: live() });
            return 'pending';
        }
        if (step.action === 'record_knowledge' && step.value) {
            const kctx = { ...context, ...((step as any).knowledgeContext || {}) };
            await saveContextualKnowledge(userId, kctx, 'rule', step.value);
            taskDocs[idx].status = 'completed';
            await missionRef.update({ tasks: live(), lastAction: `💾 Stored: ${step.value.substring(0, 50)}`, updated_at: new Date().toISOString() });
            continue;
        }
        if (step.action === 'done') {
            await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
            taskDocs[idx].status = 'completed';
            broadcastStatus(tabId, '✅ Mission complete');
            await missionRef.update({ status: 'completed', progress: 100, stepCount: stepCount + idx + 1, lastAction: '✅ Mission Completed Successfully', tasks: live() });
            if (segDocId) await completeSegmentTask(segDocId, context.unitId, segOrder).catch(() => {});
            return 'done';
        }

        let result: 'success' | 'failure' = 'success';
        let observation = step.explanation ?? step.action;
        try {
            if (['done', 'wait_for_user', 'ask_user', 'record_knowledge'].includes(step.action)) {
                // handled above — no executeAriaAction needed
            } else if (step.action === 'upload_file' && step.value) {
                const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                if (!allowed.includes(ext)) throw new Error(`File type "${ext}" not permitted`);
                await page.locator('input[type="file"]').first().setInputFiles(step.value);
            } else if (step.action === 'navigate' && step.url && /^https?:\/\/(www\.)?(google|bing|yahoo|duckduckgo)\.com\/?(\?.*)?$/.test(step.url) && !step.url.includes('search?') && !step.url.includes('q=')) {
                throw new Error(`Direct nav to ${step.url} blocked — use target URL directly`);
            } else {
                await executeAriaAction(page, step as AriaStep);
            }
        } catch (err: unknown) {
            result = 'failure';
            observation = `Action failed: ${(err as Error).message}`;
            console.error(`[StepExecutor] ❌ ${step.action} | ${(err as Error).message}`);
        }

        taskDocs[idx].status = result === 'success' ? 'completed' : 'failed';
        if (segDocId) setSubActionStatus(segDocId, idx, result === 'success' ? 'completed' : 'failed').catch(() => {});
        if (segDocId) broadcastTaskStatus(tabId, segDocId, result === 'success' ? 'completed' : 'failed');
        const pageUrl = await Promise.resolve().then(() => page.url()).catch(() => String(data.currentUrl ?? 'unknown'));
        await recordActionOutcome(userId, String(data.goal), step.action, result, observation, new URL(pageUrl || 'http://unknown').hostname).catch(() => {});
        const n = stepCount + idx + 1;
        await missionRef.update({ tasks: live(), lastAction: `${result === 'success' ? '✅' : '❌'} ${observation}`.substring(0, 120), progress: Math.min(99, Math.round((n / (n + 8)) * 100)), stepCount: n, updated_at: new Date().toISOString() });
        if (result === 'failure') console.warn(`[StepExecutor] ⚠️ step failed but continuing: ${observation}`);
    }
    // Why: all steps done — mark card complete and auto-advance next pending card to in_progress
    if (segDocId) await completeSegmentTask(segDocId, context.unitId, segOrder).catch(() => {});
    return 'pending';
}
