// Feature: Remote Mirror | Why: On-demand dom-map + SSE stream for cross-device control
// Why no auto-poll: dom-map is expensive (full Playwright DOM scan). Fetched on-demand
// by the AI agent before each action. SSE stream handles live screenshot updates.
import { useCallback, useEffect, useState } from 'react';
import { fetchRemoteDomMap, openRemoteScreenshotStream, RemoteDomMapResponse } from './remote-mirror.service';

interface RemoteMirrorState {
    screenshot: string | null;
    domMap: unknown[];
    viewport: RemoteDomMapResponse['viewport'] | null;
    lastError: string | null;
    isConnected: boolean;
}

export const useRemoteMirror = (
    baseUrl: string,
    tabId: string,
    url: string | undefined,
    enabled: boolean,
) => {
    const [state, setState] = useState<RemoteMirrorState>({
        screenshot: null,
        domMap: [],
        viewport: null,
        lastError: null,
        isConnected: false,
    });
    // Why: fetching dom-map is a full Playwright DOM scan — only call on demand
    // (e.g. before an AI agent action). Never auto-poll.
    const refresh = useCallback(async () => {
        if (!enabled || !baseUrl) return;
        try {
            const dom = await fetchRemoteDomMap(baseUrl, tabId, url);
            setState(prev => ({
                ...prev,
                domMap: Array.isArray(dom.map) ? dom.map : [],
                viewport: dom.viewport,
                lastError: null,
                isConnected: true,
            }));
        } catch (e) {
            setState(prev => ({
                ...prev,
                lastError: e instanceof Error ? e.message : String(e),
            }));
        }
    }, [baseUrl, enabled, tabId, url]);

    useEffect(() => {
        if (!enabled || !baseUrl || !url) return;
        const close = openRemoteScreenshotStream(
            baseUrl,
            tabId,
            url,
            (frame) => setState(prev => ({ ...prev, screenshot: frame, isConnected: true })),
            (message) => setState(prev => ({ ...prev, lastError: message, isConnected: false })),
        );
        return () => close();
    }, [enabled, baseUrl, tabId, url]);

    return { ...state, refresh };
};
