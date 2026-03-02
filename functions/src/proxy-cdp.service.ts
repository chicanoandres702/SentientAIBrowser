// Feature: CDP Bridge | Why: Console-log buffering + cookie helpers for DevTools features
/*
 * [Parent Feature/Milestone] CDP / DevTools Integration
 * [Child Task/Issue] CDP enhanced features
 * [Subtask] Per-tab console log buffer and cookie access
 * [Upstream] Playwright page events -> [Downstream] /cdp/* HTTP endpoints
 * [Law Check] 52 lines | Passed 100-Line Law
 */
import { Page } from 'playwright';

/** Circular buffer — keeps last 200 console entries per tab. */
const MAX_LOG_BUFFER = 200;
const consoleLogs = new Map<string, ConsoleEntry[]>();

export interface ConsoleEntry {
    type: 'log' | 'info' | 'warn' | 'error' | 'debug';
    text: string;
    ts: number;
}

/**
 * Attach a console listener to THIS page.
 * Call once inside getPersistentPage after the page is created.
 */
export function attachConsoleListener(tabId: string, page: Page): void {
    if (!consoleLogs.has(tabId)) consoleLogs.set(tabId, []);
    page.on('console', (msg) => {
        const buf = consoleLogs.get(tabId);
        if (!buf) return;
        const entry: ConsoleEntry = {
            type: (msg.type() as ConsoleEntry['type']) || 'log',
            text: msg.text().slice(0, 500),
            ts: Date.now(),
        };
        buf.push(entry);
        if (buf.length > MAX_LOG_BUFFER) buf.shift();
    });
}

/** Returns buffered console logs for a tab and clears the buffer. */
export function drainConsoleLogs(tabId: string): ConsoleEntry[] {
    const logs = consoleLogs.get(tabId) ?? [];
    consoleLogs.set(tabId, []);
    return logs;
}

/** Returns all cookies for the active page context. */
export async function getTabCookies(page: Page): Promise<object[]> {
    try {
        const context = page.context();
        return await context.cookies();
    } catch { return []; }
}

/** Clear console log buffer when a tab closes (prevents memory leak). */
export function clearConsoleLogs(tabId: string): void {
    consoleLogs.delete(tabId);
}
