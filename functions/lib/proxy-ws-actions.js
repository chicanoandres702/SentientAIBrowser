"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleClientWsMessage = handleClientWsMessage;
// Feature: Remote Input | Why: Dispatch inbound WebSocket client messages to Playwright.
// Replaces HTTP roundtrips for mouse/keyboard events — lower latency, no TCP handshake per event.
/*
 * [Parent Feature/Milestone] Remote Input
 * [Child Task/Issue] WebSocket → Playwright action dispatch
 * [Subtask] Receive ClientMsg from broker; dispatch to page.mouse / page.keyboard / page.goto
 * [Upstream] proxy-tab-sync.broker (onClientMsg) -> [Downstream] Playwright page
 * [Law Check] 58 lines | Passed 100-Line Law
 */
const proxy_page_handler_1 = require("./proxy-page-handler");
const LOAD_OPTS = { timeout: 2000 };
async function handleClientWsMessage(tabId, msg) {
    var _a, _b;
    const page = proxy_page_handler_1.activePages.get(tabId);
    if (!page || page.isClosed())
        return;
    try {
        switch (msg.type) {
            case 'click': {
                const btn = (_a = msg.button) !== null && _a !== void 0 ? _a : 'left';
                await page.mouse.click(msg.x, msg.y, btn === 'right' ? { button: 'right' } : undefined);
                await page.waitForLoadState('domcontentloaded', LOAD_OPTS).catch(() => { });
                await (0, proxy_page_handler_1.saveSessionForTab)(tabId).catch(() => { });
                break;
            }
            case 'dblclick':
                await page.mouse.dblclick(msg.x, msg.y);
                await page.waitForLoadState('domcontentloaded', LOAD_OPTS).catch(() => { });
                break;
            case 'move':
                await page.mouse.move(msg.x, msg.y);
                return; // no screenshot needed for hover — avoids frame spam
            case 'scroll':
                await page.mouse.wheel(msg.deltaX, msg.deltaY);
                break;
            case 'drag':
                await page.mouse.move(msg.fromX, msg.fromY);
                await page.mouse.down();
                await page.mouse.move(msg.toX, msg.toY, { steps: 10 });
                await page.mouse.up();
                break;
            case 'type':
                await page.keyboard.type(msg.text, { delay: 20 });
                break;
            case 'key': {
                const combo = [...((_b = msg.modifiers) !== null && _b !== void 0 ? _b : []), msg.key].join('+');
                await page.keyboard.press(combo);
                break;
            }
            case 'navigate':
                await page.goto(msg.url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => { });
                break;
            default:
                return;
        }
        // Why: capture after every mutating action so frame stream reflects latest state.
        await (0, proxy_page_handler_1.captureAndSyncTab)(tabId).catch(() => { });
    }
    catch (e) {
        console.warn(`[WsActions] ⚠️ ${msg.type} failed tab=${tabId}:`, e.message);
    }
}
//# sourceMappingURL=proxy-ws-actions.js.map