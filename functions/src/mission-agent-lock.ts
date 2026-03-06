/**
 * Sentient File Header
 * Why: Mission agent lock and API key resolution for Sentient AI Browser
 * Filepath: functions/src/mission-agent-lock.ts
 * Description: Handles agent lock acquisition and Gemini API key resolution for missions
 * Trace: Used by backend, orchestrator, and mission executor modules
 * Wiring: Exported functions, consumed by backend and orchestrator
 */
// Feature: Mission Executor | Trace: functions/src/mission-agent-lock.ts
/*
 * [Extracted Logic] Agent lock and API key resolution for mission execution
 * [Law Check] < 100 lines
 */
// import { db } from './proxy-config';
// import { sentientLogger } from './core/sentientLogger';
import { resolveGeminiApiKey } from './features/llm/api-key.resolver';
import { broadcastStatus } from './proxy-tab-sync.broker';

export async function acquireBackendAgentLock(missionRef: any, data: any): Promise<boolean> {
  if (data.executingAgent && data.executingAgent !== 'backend') {
    console.log('[Executor] ⏭ Skipping — non-backend agent has execution lock');
    return false;
  }
  try {
    await missionRef.update({ executingAgent: 'backend', updated_at: new Date().toISOString() });
    return true;
  } catch {
    console.log('[Executor] ⏭ Execution lock conflict — skipping cycle');
    return false;
  }
}

export async function resolveMissionApiKey(data: any, userId: string, tabId: string, missionRef: any): Promise<string | null> {
  const apiKey = (data.runtimeApiKey as string | undefined) || await resolveGeminiApiKey(userId);
  if (!apiKey) {
    broadcastStatus(tabId, '❌ No Gemini API key — set one in Settings');
    await missionRef.update({ lastAction: '❌ No Gemini API key — add one in Settings > LLM OVERRIDE', updated_at: new Date().toISOString() });
    return null;
  }
  return apiKey;
}
