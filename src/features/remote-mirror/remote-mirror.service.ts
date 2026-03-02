// Feature: Remote Mirror | Why: Provide remote Playwright snapshots + actions as a portable control layer

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

/** POST /proxy/click — coordinate click at Playwright viewport (x, y) pixels */
export const sendRemoteCoordClick = async (baseUrl: string, tabId: string, x: number, y: number): Promise<void> => {
    await fetch(`${baseUrl}/proxy/click`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x, y, tabId }) }).catch(() => {});
};

/** POST /proxy/mouse/move — hover to (x, y) without clicking */
export const sendMouseMove = async (baseUrl: string, tabId: string, x: number, y: number): Promise<void> => {
    await fetch(`${baseUrl}/proxy/mouse/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x, y, tabId }) }).catch(() => {});
};

/** POST /proxy/mouse/scroll — scroll wheel by (deltaX, deltaY) pixels */
export const sendMouseScroll = async (baseUrl: string, tabId: string, deltaX: number, deltaY: number): Promise<void> => {
    await fetch(`${baseUrl}/proxy/mouse/scroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deltaX, deltaY, tabId }) }).catch(() => {});
};
