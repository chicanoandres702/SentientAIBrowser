"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastCursor = exports.broadcastStatus = exports.setFrameProvider = void 0;
exports.broadcastTabSync = broadcastTabSync;
exports.registerWsClient = registerWsClient;
exports.unregisterWsClient = unregisterWsClient;
exports.handleWsUpgrade = handleWsUpgrade;
// Why: keyed by tabId so broadcasts only reach clients watching that specific tab.
const clients = new Map();
const frameIntervals = new Map();
const FRAME_MS = 200; // ~5 fps between navigation events
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
const broadcastCursor = (tabId, x, y) => broadcastTabSync(tabId, { type: 'cursor', tabId, x, y });
exports.broadcastCursor = broadcastCursor;
function startFrameStream(tabId) {
    if (frameIntervals.has(tabId))
        return;
    const t = setInterval(async () => {
        var _a;
        if (!((_a = clients.get(tabId)) === null || _a === void 0 ? void 0 : _a.size))
            return;
        const frame = await _frameProvider(tabId);
        if (frame)
            broadcastTabSync(tabId, Object.assign({ type: 'frame', tabId }, frame));
    }, FRAME_MS);
    frameIntervals.set(tabId, t);
}
function stopFrameStream(tabId) {
    const t = frameIntervals.get(tabId);
    if (t) {
        clearInterval(t);
        frameIntervals.delete(tabId);
    }
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