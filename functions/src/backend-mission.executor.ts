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
import { db } from './proxy-config';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { getAriaSnapshot, AriaStep } from './playwright-mcp-adapter';
import { resolveGeminiApiKey } from './features/llm/api-key.resolver';
import { isBotCheckUrl, isAuthWallUrl } from './proxy-nav-controller';
import { broadcastStatus } from './proxy-tab-sync.broker';
import { executeStepQueue } from './backend-step.executor';

export async function processMissionStep(missionId: string) {
  try {
    const missionRef = db.collection('missions').doc(missionId);
    const snap = await missionRef.get();
    if (!snap.exists || snap.data()?.status !== 'active') return;
    const data = snap.data()!;

    // Why: frontend may hold execution lock (e.g. manual user action). Yield immediately.
    if (data.executingAgent && data.executingAgent !== 'backend') {
      console.log('[Executor] ⏭ Skipping — non-backend agent has execution lock');
      return;
    }
    try {
      await missionRef.update({ executingAgent: 'backend', updated_at: new Date().toISOString() });
    } catch {
      console.log('[Executor] ⏭ Execution lock conflict — skipping cycle');
      return;
    }

    const { tabId = 'default', userId } = data;
    const apiKey = (data.runtimeApiKey as string | undefined) || await resolveGeminiApiKey(userId);
    if (!apiKey) {
      broadcastStatus(tabId, '❌ No Gemini API key — set one in Settings');
      await missionRef.update({ lastAction: '❌ No Gemini API key — add one in Settings > LLM OVERRIDE', updated_at: new Date().toISOString() });
      return;
    }

    const context = { groupId: data.groupId || 'DefaultGroup', contextId: data.contextId || 'DefaultContext', unitId: missionId };
    const stepCount: number = data.stepCount || 0;
    const startUrl: string | null = (data.tabUrl && data.tabUrl !== 'about:blank') ? data.tabUrl : null;
    const page = await getPersistentPage(startUrl, tabId, userId);
    if (!page) { console.error('[Executor] ❌ getPersistentPage returned null'); return; }
    const currentUrl = page.url();

    if (isBotCheckUrl(currentUrl)) {
      broadcastStatus(tabId, '🤖 Bot check detected — complete then resume');
      await missionRef.update({ status: 'waiting', lastAction: '🤖 Bot check / CAPTCHA — complete in browser then resume', updated_at: new Date().toISOString() });
      return 'pending';
    }
    if (isAuthWallUrl(currentUrl)) {
      broadcastStatus(tabId, '🔐 Auth required — complete login then resume');
      // Why: persist pre-auth returnUrl so resume navigates to original dest, not the expired SAML/SSO URL
      const returnUrl = (data.authWallReturnUrl as string | undefined) || startUrl || currentUrl;
      await missionRef.update({ status: 'waiting', lastAction: '🔐 Auth / MFA required — complete login then resume', currentUrl, authWallReturnUrl: returnUrl, updated_at: new Date().toISOString() });
      return 'pending';
    }
    const prevUrl = data.lastExecutorUrl as string | undefined;
    const sameCount = (prevUrl === currentUrl) ? ((data.sameUrlCycles as number || 0) + 1) : 0;
    await missionRef.update({ lastExecutorUrl: currentUrl, sameUrlCycles: sameCount, updated_at: new Date().toISOString() });
    if (sameCount >= 4) {
      broadcastStatus(tabId, `🔁 Stuck at ${new URL(currentUrl || 'http://x').hostname} — check and resume`);
      await missionRef.update({ status: 'waiting', lastAction: `🔁 Redirect loop at ${new URL(currentUrl || 'http://x').hostname} — check the page and resume`, sameUrlCycles: 0, updated_at: new Date().toISOString() });
      return 'pending';
    }

    const ariaSnapshot = await getAriaSnapshot(page);
    const screenshot = await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })
      .then(buf => buf.toString('base64'))
      .catch(() => { console.warn('[Executor] ⏱ screenshot timeout — proceeding with ARIA only'); return ''; });
    await missionRef.update({ lastAction: `📍 On: ${currentUrl}`, currentUrl, updated_at: new Date().toISOString() });
    broadcastStatus(tabId, '🤔 Thinking...');
    await missionRef.update({ lastAction: '🤔 Thinking...', updated_at: new Date().toISOString() });

    const response = await determineNextAction(userId, data.goal, [], screenshot, new URL(currentUrl || 'http://blank').hostname, [], true, context, ariaSnapshot, apiKey);
    if (!response) {
      await missionRef.update({ lastAction: '❌ LLM returned no response', updated_at: new Date().toISOString() });
      return;
    }
    await missionRef.update({ intelligenceSignals: response.meta.intelligenceSignals || [], lastReasoning: response.meta.reasoning || '', updated_at: new Date().toISOString() });

    const stepQueue = response.execution.segments.flatMap((s: any) => s.steps) as AriaStep[];
    const existingTasks = (data.tasks as any[] || []).filter((t: any) => t.status === 'completed' || t.status === 'failed');
    const taskDocs = stepQueue.map((step, i) => ({
      id: `step-${Date.now()}-${i}`, action: step.action, explanation: step.explanation,
      title: `${step.action}: ${step.explanation}`.substring(0, 80), status: 'pending',
    }));
    await missionRef.update({ tasks: [...existingTasks, ...taskDocs], updated_at: new Date().toISOString() });

    return await executeStepQueue(page, stepQueue, taskDocs, existingTasks, missionRef as any, data as any, context, stepCount, tabId, userId);
  } catch (e: unknown) {
    const msg = (e as Error).message;
    console.error(`[Executor] 🔥 Fatal: ${msg}`);
    try { await db.collection('missions').doc(missionId).update({ lastAction: `🔥 Error: ${msg}`.substring(0, 120), updated_at: new Date().toISOString() }); } catch {}
  }
  return 'pending';
}

