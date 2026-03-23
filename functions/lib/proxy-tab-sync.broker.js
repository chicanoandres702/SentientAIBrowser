"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastCursor = exports.broadcastTaskStatus = exports.broadcastStatus = exports.setFrameProvider = exports.setCachedFrame = exports.getCachedFrame = exports.frameCache = void 0;
exports.broadcastTabSync = broadcastTabSync;
exports.registerWsClient = registerWsClient;
exports.unregisterWsClient = unregisterWsClient;
exports.handleWsUpgrade = handleWsUpgrade;
const proxy_frame_cache_1 = require("./proxy-frame-cache");
var proxy_frame_cache_2 = require("./proxy-frame-cache");
Object.defineProperty(exports, "frameCache", { enumerable: true, get: function () { return proxy_frame_cache_2.frameCache; } });
Object.defineProperty(exports, "getCachedFrame", { enumerable: true, get: function () { return proxy_frame_cache_2.getCachedFrame; } });
Object.defineProperty(exports, "setCachedFrame", { enumerable: true, get: function () { return proxy_frame_cache_2.setCachedFrame; } });
// Why: keyed by tabId so broadcasts only reach clients watching that specific tab.
const clients = new Map();
const frameIntervals = new Map();
const FRAME_MS = 250; // 4 fps — gives page.screenshot() time to finish before next tick
let _frameProvider = async () => null;
const setFrameProvider = (fn) => { _frameProvider = fn; };
exports.setFrameProvider = setFrameProvider;
// Why: OPEN = 1 in WebSocket readyState. Avoids importing the class at call sites.
function broadcastTabSync(tabId, payload) {
    const room = clients.get(tabId);
    if (!(room === null || room === void 0 ? void 0 : room.size))
        return;
    const raw = JSON.stringify(payload);
    room.forEach(ws => { if (ws.readyState === 1)
        ws.send(raw); });
    if (payload.type !== 'frame')
        console.debug(`[TabSync] 📡 ${payload.type} tab=${tabId}`);
}
const broadcastStatus = (tabId, message) => broadcastTabSync(tabId, { type: 'status', tabId, message });
exports.broadcastStatus = broadcastStatus;
/** Why: push per-task state changes to the frontend instantly via WS so the queue
 * reflects in_progress / completed / failed <10ms after backend execution, not on
 * the next Firestore onSnapshot poll (~200ms). */
const broadcastTaskStatus = (tabId, taskId, status, nextTaskId) => broadcastTabSync(tabId, { type: 'task_status', tabId, taskId, status, nextTaskId });
exports.broadcastTaskStatus = broadcastTaskStatus;
const broadcastCursor = (tabId, x, y) => broadcastTabSync(tabId, { type: 'cursor', tabId, x, y });
exports.broadcastCursor = broadcastCursor;
function startFrameStream(tabId) {
    if (frameIntervals.has(tabId))
        return;
    const t = setInterval(async () => {
        var _a;
        if (!((_a = clients.get(tabId)) === null || _a === void 0 ? void 0 : _a.size))
            return;
        // Why: skip if the previous screenshot is still resolving — prevents stacked
        //      pending ops that arrive in a burst and cause the choppy / hang behaviour.
        if (proxy_frame_cache_1.capturingTabs.has(tabId))
            return;
        proxy_frame_cache_1.capturingTabs.add(tabId);
        try {
            const frame = await _frameProvider(tabId);
            if (frame) {
                (0, proxy_frame_cache_1.setCachedFrame)(tabId, frame);
                broadcastTabSync(tabId, Object.assign({ type: 'frame', tabId }, frame));
            }
        }
        finally {
            proxy_frame_cache_1.capturingTabs.delete(tabId);
        }
    }, FRAME_MS);
    frameIntervals.set(tabId, t);
}
function stopFrameStream(tabId) {
    const t = frameIntervals.get(tabId);
    if (t) {
        clearInterval(t);
        frameIntervals.delete(tabId);
    }
    proxy_frame_cache_1.capturingTabs.delete(tabId); // Why: clear stale in-flight flag so next client starts clean
    proxy_frame_cache_1.frameCache.delete(tabId); // Why: free memory when no clients are watching this tab
}
function registerWsClient(tabId, ws) {
    if (!clients.has(tabId))
        clients.set(tabId, new Set());
    clients.get(tabId).add(ws);
    startFrameStream(tabId);
    console.debug(`[TabSync] ➕ client registered tab=${tabId} total=${clients.get(tabId).size}`);
}
function unregisterWsClient(tabId, ws) {
    var _a, _b;
    (_a = clients.get(tabId)) === null || _a === void 0 ? void 0 : _a.delete(ws);
    if (!((_b = clients.get(tabId)) === null || _b === void 0 ? void 0 : _b.size)) {
        clients.delete(tabId);
        stopFrameStream(tabId);
    }
    console.debug(`[TabSync] ➖ client removed tab=${tabId}`);
}
/** Called by proxy-server.ts on 'upgrade'. onClientMsg dispatches to proxy-ws-actions. */
function handleWsUpgrade(wss, req, socket, head, onClientMsg) {
    var _a;
    const tabId = ((_a = req.url) !== null && _a !== void 0 ? _a : '').replace(/^\/proxy\/ws\/?/, '') || 'default';
    wss.handleUpgrade(req, socket, head, (ws) => {
        registerWsClient(tabId, ws);
        ws.send(JSON.stringify({ type: 'connected', tabId }));
        ws.on('message', (raw) => {
            if (!onClientMsg)
                return;
            try {
                onClientMsg(tabId, JSON.parse(raw.toString()));
            }
            catch ( /* ignore */_a) { /* ignore */ }
        });
        ws.on('close', () => unregisterWsClient(tabId, ws));
        ws.on('error', () => { ws.terminate(); unregisterWsClient(tabId, ws); });
    });
}
//# sourceMappingURL=proxy-tab-sync.broker.js.map