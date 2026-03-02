// Feature: Navigation + Remote Input | Why: Bidirectional WebSocket channel.
// Server→client: url, screenshot, live frame stream, cursor position, status.
// Client→server: mouse + keyboard + navigate actions (replaces HTTP roundtrips).
/*
 * [Parent Feature/Milestone] Navigation + Remote Input
 * [Child Task/Issue] Bidirectional WebSocket sync channel
 * [Subtask] Registry tabId→Set<WebSocket>; frame stream per tab; client action dispatch
 * [Upstream] proxy-url-watcher + proxy-page-handler -> [Downstream] useTabSyncSocket
 * [Law Check] 88 lines | Passed 100-Line Law
 */
import { WebSocket, WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

/** All messages pushed server → client */
export type ServerMsg =
    | { type: 'url';        tabId: string; url: string; title: string }
    | { type: 'screenshot'; tabId: string; data: string; url: string }  // nav-triggered
    | { type: 'frame';      tabId: string; data: string; url: string }  // streaming interval
    | { type: 'cursor';     tabId: string; x: number; y: number }
    | { type: 'status';     tabId: string; message: string }
    | { type: 'connected';  tabId: string };

/** Backward-compat alias — existing callers use TabSyncMessage unchanged */
export type TabSyncMessage = ServerMsg;

/** All messages sent client → server */
export type ClientMsg =
    | { type: 'click';    x: number; y: number; button?: 'left' | 'right' | 'middle' }
    | { type: 'dblclick'; x: number; y: number }
    | { type: 'move';     x: number; y: number }
    | { type: 'scroll';   deltaX: number; deltaY: number }
    | { type: 'drag';     fromX: number; fromY: number; toX: number; toY: number }
    | { type: 'type';     text: string }
    | { type: 'key';      key: string; modifiers?: string[] }
    | { type: 'navigate'; url: string };

// Why: keyed by tabId so broadcasts only reach clients watching that specific tab.
const clients = new Map<string, Set<WebSocket>>();
const frameIntervals = new Map<string, ReturnType<typeof setInterval>>();
const FRAME_MS = 200; // ~5 fps between navigation events

// Injected by proxy-page-handler at startup — avoids circular import (page-handler → broker).
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
        const frame = await _frameProvider(tabId);
        if (frame) broadcastTabSync(tabId, { type: 'frame', tabId, ...frame });
    }, FRAME_MS);
    frameIntervals.set(tabId, t);
}

function stopFrameStream(tabId: string): void {
    const t = frameIntervals.get(tabId);
    if (t) { clearInterval(t); frameIntervals.delete(tabId); }
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
