"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMissionSnapshot = getMissionSnapshot;
/**
 * Sentient File Header
 * Why: Mission ARIA snapshot and screenshot logic for Sentient AI Browser
 * Filepath: functions/src/mission-snapshot.ts
 * Description: Captures ARIA snapshot and screenshot for mission execution
 * Trace: Used by backend, orchestrator, and mission executor modules
 * Wiring: Exported function, consumed by backend and orchestrator
 */
// Feature: Mission Executor | Trace: functions/src/mission-snapshot.ts
/*
 * [Extracted Logic] ARIA snapshot and screenshot logic for mission execution
 * [Law Check] < 100 lines
 */
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
async function getMissionSnapshot(page, tabId) {
    const ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
    const _cf = (0, proxy_tab_sync_broker_1.getCachedFrame)(tabId);
    const screenshot = (_cf && Date.now() - _cf.ts < 2000)
        ? _cf.data.replace('data:image/jpeg;base64,', '')
        : await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })
            .then((buf) => buf.toString('base64'))
            .catch(() => { console.warn('[Executor] ⏱ screenshot timeout — proceeding with ARIA only'); return ''; });
    return { ariaSnapshot, screenshot };
}
//# sourceMappingURL=mission-snapshot.js.map