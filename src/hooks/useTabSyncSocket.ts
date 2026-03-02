// Feature: Navigation + Remote Input | Why: Bidirectional WebSocket client.
// Receives url/screenshot/frame/cursor/status from the server; sends mouse/keyboard/navigate
// actions back — replacing separate HTTP roundtrips for every coordinate event.
/*
 * [Parent Feature/Milestone] Navigation + Remote Input
 * [Child Task/Issue] Bidirectional WebSocket client hook
 * [Subtask] All server events → callbacks; send() → server; setWsSend singleton on connect
 * [Upstream] proxy-tab-sync.broker -> [Downstream] useBrowserCapabilities + remote-mirror.service
 * [Law Check] 82 lines | Passed 100-Line Law
 */
import { useEffect, useRef, useCallback } from 'react';
import { setWsSend, type ClientMsg } from '../features/remote-mirror/tab-sync-socket.singleton';

type ServerMsg =
    | { type: 'url';        tabId: string; url: string; title: string }
    | { type: 'screenshot'; tabId: string; data: string; url: string }
    | { type: 'frame';      tabId: string; data: string; url: string }
    | { type: 'cursor';     tabId: string; x: number; y: number }
    | { type: 'status';     tabId: string; message: string }
    | { type: 'connected';  tabId: string };

interface Options {
    baseUrl:     string;
    tabId:       string;
    enabled:     boolean;
    onUrlChange: (url: string, title: string, tabId: string) => void;
    onFrame?:    (data: string, tabId: string) => void;
    onCursor?:   (x: number, y: number, tabId: string) => void;
    onStatus?:   (message: string, tabId: string) => void;
}

const BASE_MS = 2_000;
const MAX_MS  = 30_000;

/**
 * Connects to ws[s]://<PROXY_BASE_URL>/proxy/ws/<tabId>.
 * send() is stable across renders (useCallback + wsRef) — safe to pass to service layer.
 * Why noStore: all callbacks are refs so the effect never re-runs on render.
 */
export const useTabSyncSocket = ({ baseUrl, tabId, enabled, onUrlChange, onFrame, onCursor, onStatus }: Options) => {
    const cbUrl    = useRef(onUrlChange); useEffect(() => { cbUrl.current    = onUrlChange; }, [onUrlChange]);
    const cbFrame  = useRef(onFrame);     useEffect(() => { cbFrame.current  = onFrame;     }, [onFrame]);
    const cbCursor = useRef(onCursor);    useEffect(() => { cbCursor.current = onCursor;    }, [onCursor]);
    const cbStatus = useRef(onStatus);    useEffect(() => { cbStatus.current = onStatus;    }, [onStatus]);
    const wsRef    = useRef<WebSocket | null>(null);

    // Why: stable send ref — never changes, wsRef.current always points to live socket.
    const send = useCallback((msg: ClientMsg) => {
        if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify(msg));
    }, []);

    useEffect(() => {
        if (!enabled || !baseUrl || !tabId) return;
        let dead = false;
        let attempt = 0;
        let timer: ReturnType<typeof setTimeout>;

        const connect = (delay = 0) => {
            timer = setTimeout(() => {
                if (dead) return;
                // Why: replace http[s] with ws[s] — works for both local and Cloud Run TLS.
                const wsUrl = baseUrl.replace(/^http/, 'ws') + '/proxy/ws/' + tabId;
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    attempt = 0;
                    setWsSend(send); // wire singleton so remote-mirror.service can use this socket
                    console.debug(`[TabSyncSocket] ✅ connected tab=${tabId}`);
                };
                ws.onerror = () => ws.close();
                ws.onclose = () => {
                    wsRef.current = null;
                    if (dead) return;
                    attempt++;
                    const backoff = Math.min(BASE_MS * 2 ** Math.max(0, attempt - 1), MAX_MS) + Math.random() * 500;
                    connect(backoff);
                };
                ws.onmessage = ({ data }) => {
                    try {
                        const msg: ServerMsg = JSON.parse(data as string);
                        if (msg.tabId !== tabId) return;
                        if (msg.type === 'url') cbUrl.current(msg.url, msg.title, msg.tabId);
                        if ((msg.type === 'screenshot' || msg.type === 'frame') && msg.data)
                            cbFrame.current?.(msg.data, msg.tabId);
                        if (msg.type === 'cursor') cbCursor.current?.(msg.x, msg.y, msg.tabId);
                        if (msg.type === 'status') cbStatus.current?.(msg.message, msg.tabId);
                    } catch { /* malformed frame — ignore */ }
                };
            }, delay);
        };

        connect();
        return () => { dead = true; clearTimeout(timer); wsRef.current?.close(); wsRef.current = null; };
    }, [enabled, baseUrl, tabId, send]);

    return { send };
};
