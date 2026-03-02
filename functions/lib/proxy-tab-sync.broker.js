"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWsClient = registerWsClient;
exports.unregisterWsClient = unregisterWsClient;
exports.broadcastTabSync = broadcastTabSync;
exports.handleWsUpgrade = handleWsUpgrade;
// Why: keyed by tabId so each broadcast only reaches clients watching that specific tab.
const clients = new Map();
function registerWsClient(tabId, ws) {
    if (!clients.has(tabId))
        clients.set(tabId, new Set());
    clients.get(tabId).add(ws);
    console.debug(`[TabSync] ➕ client registered tab=${tabId} total=${clients.get(tabId).size}`);
}
function unregisterWsClient(tabId, ws) {
    var _a, _b;
    (_a = clients.get(tabId)) === null || _a === void 0 ? void 0 : _a.delete(ws);
    if (((_b = clients.get(tabId)) === null || _b === void 0 ? void 0 : _b.size) === 0)
        clients.delete(tabId);
    console.debug(`[TabSync] ➖ client removed tab=${tabId}`);
}
// Why: OPEN = 1 in the WebSocket readyState enum. Avoids importing the class at call sites.
function broadcastTabSync(tabId, payload) {
    const room = clients.get(tabId);
    if (!room || room.size === 0)
        return;
    const data = JSON.stringify(payload);
    room.forEach(ws => { if (ws.readyState === 1)
        ws.send(data); });
    console.debug(`[TabSync] 📡 broadcast type=${payload.type} tab=${tabId} to ${room.size} client(s)`);
}
/**
 * Called by proxy-server.ts on 'upgrade' — routes /proxy/ws/:tabId connections into the broker.
 * Why noServer: the http.Server owns the TCP socket; wss only handles the WS handshake.
 */
function handleWsUpgrade(wss, req, socket, head) {
    var _a;
    const tabId = ((_a = req.url) !== null && _a !== void 0 ? _a : '').replace(/^\/proxy\/ws\/?/, '') || 'default';
    wss.handleUpgrade(req, socket, head, (ws) => {
        registerWsClient(tabId, ws);
        ws.send(JSON.stringify({ type: 'connected', tabId }));
        ws.on('close', () => unregisterWsClient(tabId, ws));
        ws.on('error', () => { ws.terminate(); unregisterWsClient(tabId, ws); });
    });
}
//# sourceMappingURL=proxy-tab-sync.broker.js.map