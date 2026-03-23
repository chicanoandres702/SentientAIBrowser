// Feature: Remote Mirror | Why: Provide remote Playwright snapshots + actions as a portable control layer
// Coordinate-based actions (click, move, scroll) now go over the shared WebSocket instead of
// per-event HTTP POST — eliminating one TCP handshake + server roundtrip per mouse event.
import { wsSend } from './tab-sync-socket.singleton';

export interface RemoteViewport {
    vw: number;
    vh: number;
}

export interface RemoteDomMapResponse {
    map: unknown[];
    viewport: RemoteViewport;
    url?: string;
}

/** ARIA selector fields — Playwright MCP style, stable across DOM mutations */
export interface AriaSelector {
    role?: string;
    name?: string;
    text?: string;
}

export const fetchRemoteDomMap = async (
    baseUrl: string,
    tabId: string,
    url?: string,
): Promise<RemoteDomMapResponse> => {
    const params = new URLSearchParams({ tabId });
    if (url) params.set('url', url);
    const res = await fetch(`${baseUrl}/proxy/dom-map?${params.toString()}`);
    if (!res.ok) throw new Error(`dom-map ${res.status}`);
    return res.json();
};

export const fetchRemoteScreenshot = async (
    baseUrl: string,
    tabId: string,
    url?: string,
): Promise<string> => {
    const params = new URLSearchParams({ tabId });
    if (url) params.set('url', url);
    const res = await fetch(`${baseUrl}/screenshot?${params.toString()}`);
    if (!res.ok) throw new Error(`screenshot ${res.status}`);
    const data = await res.json();
    return data.screenshot as string;
};

export const openRemoteScreenshotStream = (
    baseUrl: string,
    tabId: string,
    url: string | undefined,
    onFrame: (dataUrl: string) => void,
    onError: (message: string) => void,
) => {
    if (typeof EventSource === 'undefined') return () => {};
    const params = new URLSearchParams({ tabId });
    if (url) params.set('url', url);
    const source = new EventSource(`${baseUrl}/screenshot/stream?${params.toString()}`);
    source.onmessage = (e) => onFrame(e.data);
    source.onerror = () => onError('stream error');
    return () => source.close();
};

export const sendRemoteAction = async (
    baseUrl: string,
    tabId: string,
    url: string | undefined,
    action: 'click' | 'type',
    id: string | undefined,
    value?: string,
    ariaSelector?: AriaSelector,
): Promise<{ finalUrl?: string }> => {
    const res = await fetch(`${baseUrl}/proxy/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, action, id, value, tabId, ...ariaSelector }),
    });
    if (!res.ok) throw new Error(`action ${res.status}`);
    return res.json();
};

/** Coordinate click — sent over the shared WebSocket (no HTTP roundtrip). */
export const sendRemoteCoordClick = (_baseUrl: string, _tabId: string, x: number, y: number): void => {
    wsSend({ type: 'click', x, y });
};

/** Hover move — sent over the shared WebSocket. */
export const sendMouseMove = (_baseUrl: string, _tabId: string, x: number, y: number): void => {
    wsSend({ type: 'move', x, y });
};

/** Scroll wheel — sent over the shared WebSocket. */
export const sendMouseScroll = (_baseUrl: string, _tabId: string, deltaX: number, deltaY: number): void => {
    wsSend({ type: 'scroll', deltaX, deltaY });
};
