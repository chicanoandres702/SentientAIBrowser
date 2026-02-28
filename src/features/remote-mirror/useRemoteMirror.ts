// Feature: Remote Mirror | Why: Poll remote Playwright state for cross-device control
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRemoteDomMap, openRemoteScreenshotStream, RemoteDomMapResponse } from './remote-mirror.service';

const BASE_POLL_MS = 2500;
const MAX_POLL_MS = 12000;

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
    const pollMsRef = useRef(BASE_POLL_MS);

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
            pollMsRef.current = BASE_POLL_MS;
        } catch (e) {
            pollMsRef.current = Math.min(MAX_POLL_MS, pollMsRef.current * 2);
            setState(prev => ({
                ...prev,
                lastError: e instanceof Error ? e.message : String(e),
                isConnected: false,
            }));
        }
    }, [baseUrl, enabled, tabId, url]);

    useEffect(() => {
        if (!enabled || !url) return;
        let active = true;
        const tick = async () => {
            if (!active) return;
            await refresh();
            if (!active) return;
            setTimeout(tick, pollMsRef.current);
        };
        tick();
        return () => { active = false; };
    }, [enabled, url, refresh]);

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
