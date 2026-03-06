"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUrlChecks = handleUrlChecks;
/**
 * Sentient File Header
 * Why: Mission status checks and broadcasting for Sentient AI Browser
 * Filepath: functions/src/mission-status-checks.ts
 * Description: Handles URL checks, bot/auth wall detection, and status broadcasting
 * Trace: Used by backend, orchestrator, and mission executor modules
 * Wiring: Exported function, consumed by backend and orchestrator
 */
// Feature: Mission Executor | Trace: functions/src/mission-status-checks.ts
/*
 * [Extracted Logic] URL checks and status broadcasting for mission execution
 * [Law Check] < 100 lines
 */
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
const proxy_nav_controller_1 = require("./proxy-nav-controller");
async function handleUrlChecks(currentUrl, tabId, missionRef, data, startUrl) {
    if ((0, proxy_nav_controller_1.isBotCheckUrl)(currentUrl)) {
        (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '🤖 Bot check detected — complete then resume');
        await missionRef.update({ status: 'waiting', lastAction: '🤖 Bot check / CAPTCHA — complete in browser then resume', updated_at: new Date().toISOString() });
        return 'pending';
    }
    if ((0, proxy_nav_controller_1.isAuthWallUrl)(currentUrl)) {
        (0, proxy_tab_sync_broker_1.broadcastStatus)(tabId, '🔐 Auth required — complete login then resume');
        const returnUrl = data.authWallReturnUrl || startUrl || currentUrl;
        await missionRef.update({ status: 'waiting', lastAction: '🔐 Auth / MFA required — complete login then resume', currentUrl, authWallReturnUrl: returnUrl, updated_at: new Date().toISOString() });
        return 'pending';
    }
    return null;
}
//# sourceMappingURL=mission-status-checks.js.map