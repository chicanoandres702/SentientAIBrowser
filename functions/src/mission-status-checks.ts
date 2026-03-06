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
import { broadcastStatus } from './proxy-tab-sync.broker';
import { isBotCheckUrl, isAuthWallUrl } from './proxy-nav-controller';

export async function handleUrlChecks(currentUrl: string, tabId: string, missionRef: any, data: any, startUrl: string | null): Promise<'pending' | null> {
  if (isBotCheckUrl(currentUrl)) {
    broadcastStatus(tabId, '🤖 Bot check detected — complete then resume');
    await missionRef.update({ status: 'waiting', lastAction: '🤖 Bot check / CAPTCHA — complete in browser then resume', updated_at: new Date().toISOString() });
    return 'pending';
  }
  if (isAuthWallUrl(currentUrl)) {
    broadcastStatus(tabId, '🔐 Auth required — complete login then resume');
    const returnUrl = (data.authWallReturnUrl as string | undefined) || startUrl || currentUrl;
    await missionRef.update({ status: 'waiting', lastAction: '🔐 Auth / MFA required — complete login then resume', currentUrl, authWallReturnUrl: returnUrl, updated_at: new Date().toISOString() });
    return 'pending';
  }
  return null;
}
