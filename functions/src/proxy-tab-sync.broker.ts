// Feature: Navigation + Remote Input | Trace: README.md
/*
 * [Parent Feature/Milestone] Navigation + Remote Input
 * [Child Task/Issue] Architecture Refactor — Extract types + frame cache from broker
 * [Subtask] WS hub + broadcast + frame stream; types in .types.ts; cache in proxy-frame-cache.ts
 * [Upstream] proxy-page-handler (frame provider) -> [Downstream] useTabSyncSocket
 * [Law Check] 99 lines | Passed 100-Line Law
 */
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import { frameCache, capturingTabs, setCachedFrame } from './proxy-frame-cache';
// Re-export types + cache for backward compat
export type { ServerMsg, TabSyncMessage, ClientMsg } from './proxy-tab-sync.types';
import type { ServerMsg, ClientMsg } from './proxy-tab-sync.types';
export { frameCache, getCachedFrame, setCachedFrame } from './proxy-frame-cache';
// Why: keyed by tabId so broadcasts only reach clients watching that specific tab.
const clients = new Map<string, Set<WebSocket>>();
const frameIntervals = new Map<string, ReturnType<typeof setInterval>>();
const FRAME_MS = 250; // 4 fps — gives page.screenshot() time to finish before next tick
type FrameProvider = (tabId: string) => Promise<{ data: string; url: string } | null>;
let _frameProvider: FrameProvider = async () => null;
export const setFrameProvider = (fn: FrameProvider): void => { _frameProvider = fn; };

// Why: OPEN = 1 in WebSocket readyState. Avoids importing the class at call sites.
export function broadcastTabSync(tabId: string, payload: ServerMsg): void {
    const room = clients.get(tabId);
    if (!room?.size) return;
    const raw = JSON.stringify(payload);
    room.forEach(ws => { if (ws.readyState === 1) ws.send(raw); });
    if (payload.type !== 'frame') console.debug(`[TabSync] 📡 ${payload.type} tab=${tabId}`);
}

export const broadcastStatus = (tabId: string, message: string): void =>
    broadcastTabSync(tabId, { type: 'status', tabId, message });

export const broadcastCursor = (tabId: string, x: number, y: number): void =>
    broadcastTabSync(tabId, { type: 'cursor', tabId, x, y });

function startFrameStream(tabId: string): void {
    if (frameIntervals.has(tabId)) return;
    const t = setInterval(async () => {
        if (!clients.get(tabId)?.size) return;
        // Why: skip if the previous screenshot is still resolving — prevents stacked
        //      pending ops that arrive in a burst and cause the choppy / hang behaviour.
        if (capturingTabs.has(tabId)) return;
        capturingTabs.add(tabId);
        try {
            const frame = await _frameProvider(tabId);
            if (frame) {
                setCachedFrame(tabId, frame);
                broadcastTabSync(tabId, { type: 'frame', tabId, ...frame });
            }
        } finally { capturingTabs.delete(tabId); }
    }, FRAME_MS);
    frameIntervals.set(tabId, t);
}

function stopFrameStream(tabId: string): void {
    const t = frameIntervals.get(tabId);
    if (t) { clearInterval(t); frameIntervals.delete(tabId); }
    capturingTabs.delete(tabId); // Why: clear stale in-flight flag so next client starts clean
    frameCache.delete(tabId);   // Why: free memory when no clients are watching this tab
}

export function registerWsClient(tabId: string, ws: WebSocket): void {
    if (!clients.has(tabId)) clients.set(tabId, new Set());
    clients.get(tabId)!.add(ws);
    startFrameStream(tabId);
    console.debug(`[TabSync] ➕ client registered tab=${tabId} total=${clients.get(tabId)!.size}`);
}

export function unregisterWsClient(tabId: string, ws: WebSocket): void {
    clients.get(tabId)?.delete(ws);
    if (!clients.get(tabId)?.size) { clients.delete(tabId); stopFrameStream(tabId); }
    console.debug(`[TabSync] ➖ client removed tab=${tabId}`);
}

/** Called by proxy-server.ts on 'upgrade'. onClientMsg dispatches to proxy-ws-actions. */
export function handleWsUpgrade(
    wss: WebSocketServer,
    req: IncomingMessage,
    socket: Socket,
    head: Buffer,
    onClientMsg?: (tabId: string, msg: ClientMsg) => void,
): void {
    const tabId = (req.url ?? '').replace(/^\/proxy\/ws\/?/, '') || 'default';
    wss.handleUpgrade(req, socket, head, (ws) => {
        registerWsClient(tabId, ws);
        ws.send(JSON.stringify({ type: 'connected', tabId } satisfies ServerMsg));
        ws.on('message', (raw) => {
            if (!onClientMsg) return;
            try { onClientMsg(tabId, JSON.parse(raw.toString()) as ClientMsg); } catch { /* ignore */ }
        });
        ws.on('close', () => unregisterWsClient(tabId, ws));
        ws.on('error', () => { ws.terminate(); unregisterWsClient(tabId, ws); });
    });
}
