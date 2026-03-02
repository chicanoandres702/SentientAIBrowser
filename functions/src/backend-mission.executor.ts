// Feature: Mission Executor | Trace: backend-ai-orchestrator.js
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { recordActionOutcome } from './features/llm/llm-memory-service';
import { saveContextualKnowledge } from './features/llm/knowledge-hierarchy.service';
import { getAriaSnapshot, executeAriaAction, AriaStep } from './playwright-mcp-adapter';
import { resolveGeminiApiKey } from './features/llm/api-key.resolver';
import { isBotCheckUrl, isAuthWallUrl } from './proxy-nav-controller';

export async function processMissionStep(missionId: string) {
  try {
    const missionRef = db.collection('missions').doc(missionId);
    const snap = await missionRef.get();
    if (!snap.exists || snap.data()?.status !== 'active') return;
    const data = snap.data()!;
    if (data.executingAgent && data.executingAgent !== 'backend') {
      console.log(`[Executor] ⏭ Skipping — frontend has execution lock`);
      return;
    }
    try { await missionRef.update({ executingAgent: 'backend', updated_at: new Date().toISOString() }); } catch { console.log(`[Executor] ⏭ Execution lock conflict — skipping cycle`); return; }
    const { tabId = 'default', userId } = data;
    // Why: API key is written to missions doc by frontend (mission-builder.ts runtimeApiKey field).
    // This is the fastest and most reliable path — no extra Firestore round-trip needed.
    // Fall back to user settings doc, then to server env vars (local dev / Cloud Run GOOGLE_API_KEY).
    const apiKey = (data.runtimeApiKey as string | undefined) || await resolveGeminiApiKey(userId);
    if (!apiKey) {
        console.error('[Executor] ❌ No Gemini API key — set one in Settings > LLM OVERRIDE');
        await missionRef.update({ lastAction: '❌ No Gemini API key — set one in Settings > LLM OVERRIDE', updated_at: new Date().toISOString() });
        return;
    }
    const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
    const stepCount: number = data.stepCount || 0;
    const page = await getPersistentPage(null, tabId, userId);
    if (!page) { console.error('[Executor] ❌ getPersistentPage returned null'); return; }
    const currentUrl = page.url();

    // ── REDIRECT / AUTH-WALL GUARD ─────────────────────────────────────────────
    // Why: If the page is on a bot-check or auth wall the LLM can't break out —
    // every cycle will navigate back and hit the same redirect. Pause immediately
    // so the user can complete the CAPTCHA/MFA, then resume manually.
    if (isBotCheckUrl(currentUrl)) {
        console.warn(`[Executor] 🤖 Bot-check detected at ${currentUrl} — pausing mission`);
        await missionRef.update({ status: 'waiting', lastAction: '🤖 Bot check / CAPTCHA — complete in browser then resume', updated_at: new Date().toISOString() });
        return 'pending';
    }
    if (isAuthWallUrl(currentUrl)) {
        console.warn(`[Executor] 🔐 Auth wall detected at ${currentUrl} — pausing mission`);
        await missionRef.update({ status: 'waiting', lastAction: '🔐 Auth / MFA required — complete login then resume', currentUrl, updated_at: new Date().toISOString() });
        return 'pending';
    }
    // Stuck-redirect detector: if URL unchanged for 4 executor cycles, pause.
    // Why: catches any other redirect loops not covered by the explicit patterns above.
    const prevUrl: string | undefined = data.lastExecutorUrl;
    const sameCount: number = (prevUrl === currentUrl) ? ((data.sameUrlCycles || 0) + 1) : 0;
    await missionRef.update({ lastExecutorUrl: currentUrl, sameUrlCycles: sameCount, updated_at: new Date().toISOString() });
    if (sameCount >= 4) {
        console.warn(`[Executor] 🔁 Redirect loop — same URL ${sameCount} cycles: ${currentUrl}`);
        await missionRef.update({ status: 'waiting', lastAction: `🔁 Redirect loop detected — stuck at ${new URL(currentUrl || 'http://x').hostname}. Check the page and resume.`, sameUrlCycles: 0, updated_at: new Date().toISOString() });
        return 'pending';
    }
    const ariaSnapshot = await getAriaSnapshot(page);
        // Why: quality 30 reduces base64 payload ~40% vs 50, speeds up LLM round-trip
        const screenshot = (await page.screenshot({ quality: 30, type: 'jpeg' })).toString('base64');
        // Write current URL so UI address bar + lastAction stay live
        await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });

        // ── STAGE 3: LLM decision (re-plan with current ARIA state) ────────────────────
        await missionRef.update({ lastAction: '🤔 Thinking...', updated_at: new Date().toISOString() });
        const response = await determineNextAction(userId, data.goal, [], screenshot, new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot, apiKey);
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
        const existingTasks: any[] = (data.tasks || []).filter((t: any) =>
            t.status === 'completed' || t.status === 'failed'
        );
        const taskDocs: any[] = stepQueue.map((step, i) => ({
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
                const targetContext = { ...context, ...(step.knowledgeContext || {}) };
                await saveContextualKnowledge(userId, targetContext, 'rule', step.value);
                taskDocs[idx].status = 'completed';
                await missionRef.update({ tasks: liveTasks(), lastAction: `💾 Stored: ${step.value.substring(0, 50)}`, updated_at: new Date().toISOString() });
                continue; // Why: fully handled — skip executeAriaAction path below
            }
            if (step.action === 'done') {
                await saveContextualKnowledge(userId, context, 'breadcrumb', `Completed: ${data.goal}`);
                taskDocs[idx].status = 'completed';
                await missionRef.update({ status: 'completed', progress: 100, stepCount: stepCount + idx + 1, lastAction: '✅ Mission Completed Successfully', tasks: liveTasks() });
                return 'done';
            }

            let result: 'success' | 'failure' = 'success';
            let observation = step.explanation;

            try {
                // Why: LLM now returns ARIA role+name selectors (not numeric data-ai-id).
                // Route ALL actions through executeAriaAction which uses page.getByRole/getByText —
                // the same mechanism @playwright/mcp uses. Selectors resolve fresh at call time.
                const actionStr = step.action as string;
                if (actionStr === 'done' || actionStr === 'wait_for_user' || actionStr === 'ask_user' || actionStr === 'record_knowledge') {
                    // handled above — skip executeAriaAction
                } else if (step.action === 'upload_file' && step.value) {
                    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                    const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                    if (!allowed.includes(ext)) throw new Error(`File type "${ext}" not permitted`);
                    await page.locator('input[type="file"]').first().setInputFiles(step.value);
                } else {
                    await executeAriaAction(page, step as AriaStep);
                }
            } catch (err: any) {
                result = 'failure';
                observation = `Action failed: ${err.message}`;
                console.error(`[Executor] ❌ STAGE 4 step FAIL — action:${step.action} | ${err.message}`);
            }

            taskDocs[idx].status = result === 'success' ? 'completed' : 'failed';
            const pageUrlNow = await Promise.resolve().then(() => page.url()).catch(() => currentUrl || 'unknown');
            await recordActionOutcome(userId, data.goal, step.action, result, observation, new URL(pageUrlNow || 'http://unknown').hostname).catch(() => {});
            const nextStepCount = stepCount + idx + 1; const nextProgress = Math.min(99, Math.round((nextStepCount / (nextStepCount + 8)) * 100));
            await missionRef.update({ tasks: liveTasks(), lastAction: `${result === 'success' ? '✅' : '❌'} ${observation}`.substring(0, 120), progress: nextProgress, stepCount: nextStepCount, updated_at: new Date().toISOString() });
            if (result === 'failure') console.warn(`[Executor] ⚠️ step failed but continuing: ${observation}`);
        }
    } catch (e: unknown) {
        const err = e as Error; console.error(`[Executor] 🔥 Fatal: ${err.message}`);
        try { await db.collection('missions').doc(missionId).update({ lastAction: `🔥 Error: ${err.message}`.substring(0, 120), updated_at: new Date().toISOString() }); } catch {}
    }
    return 'pending';
}

