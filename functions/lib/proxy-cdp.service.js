"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachConsoleListener = attachConsoleListener;
exports.drainConsoleLogs = drainConsoleLogs;
exports.getTabCookies = getTabCookies;
exports.clearConsoleLogs = clearConsoleLogs;
/** Circular buffer — keeps last 200 console entries per tab. */
const MAX_LOG_BUFFER = 200;
const consoleLogs = new Map();
/**
 * Attach a console listener to THIS page.
 * Call once inside getPersistentPage after the page is created.
 */
function attachConsoleListener(tabId, page) {
    if (!consoleLogs.has(tabId))
        consoleLogs.set(tabId, []);
    page.on('console', (msg) => {
        const buf = consoleLogs.get(tabId);
        if (!buf)
            return;
        const entry = {
            type: msg.type() || 'log',
            text: msg.text().slice(0, 500),
            ts: Date.now(),
        };
        buf.push(entry);
        if (buf.length > MAX_LOG_BUFFER)
            buf.shift();
    });
}
/** Returns buffered console logs for a tab and clears the buffer. */
function drainConsoleLogs(tabId) {
    var _a;
    const logs = (_a = consoleLogs.get(tabId)) !== null && _a !== void 0 ? _a : [];
    consoleLogs.set(tabId, []);
    return logs;
}
/** Returns all cookies for the active page context. */
async function getTabCookies(page) {
    try {
        const context = page.context();
        return await context.cookies();
    }
    catch (_a) {
        return [];
    }
}
/** Clear console log buffer when a tab closes (prevents memory leak). */
function clearConsoleLogs(tabId) {
    consoleLogs.delete(tabId);
}
//# sourceMappingURL=proxy-cdp.service.js.map