"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acquireBackendAgentLock = acquireBackendAgentLock;
exports.resolveMissionApiKey = resolveMissionApiKey;
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
const api_key_resolver_1 = require("./features/llm/api-key.resolver");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
async function acquireBackendAgentLock(missionRef, data) {
    if (data.executingAgent && data.executingAgent !== 'backend') {
        console.log('[Executor] ⏭ Skipping — non-backend agent has execution lock');
        return false;
    }
    try {
        await missionRef.update({ executingAgent: 'backend', updated_at: new Date().toISOString() });
        return true;
    }
    catch (_a) {
        console.log('[Executor] ⏭ Execution lock conflict — skipping cycle');
        return false;
    }
}
async function resolveMissionApiKey(data, userId, tabId, missionRef) {
    const apiKey = data.runtimeApiKey || await (0, api_key_resolver_1.resolveGeminiApiKey)(userId);
    if (!apiKey) {
        (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '❌ No Gemini API key — set one in Settings');
        await missionRef.update({ lastAction: '❌ No Gemini API key — add one in Settings > LLM OVERRIDE', updated_at: new Date().toISOString() });
        return null;
    }
    return apiKey;
}
//# sourceMappingURL=mission-agent-lock.js.map