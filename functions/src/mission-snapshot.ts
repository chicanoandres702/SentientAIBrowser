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
import { getAriaSnapshot } from './playwright-mcp-adapter';
import { getCachedFrame } from './proxy-tab-sync.broker';

export async function getMissionSnapshot(page: any, tabId: string): Promise<{ ariaSnapshot: any, screenshot: string }> {
  const ariaSnapshot = await getAriaSnapshot(page);
  const _cf = getCachedFrame(tabId);
  const screenshot = (_cf && Date.now() - _cf.ts < 2000)
    ? _cf.data.replace('data:image/jpeg;base64,', '')
    : await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })
        .then((buf: Buffer) => buf.toString('base64'))
        .catch(() => { console.warn('[Executor] ⏱ screenshot timeout — proceeding with ARIA only'); return ''; });
  return { ariaSnapshot, screenshot };
}
