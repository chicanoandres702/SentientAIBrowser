// Feature: Remote Mirror | Why: On-demand dom-map fetch for cross-device control.
// Screenshot streaming is now handled by the shared WebSocket (useTabSyncSocket → frame events).
// This hook only manages the Playwright DOM snapshot — expensive, so always on-demand only.
/*
 * [Parent Feature/Milestone] Remote Input
 * [Child Task/Issue] Remove SSE screenshot stream — WS handles frames
 * [Subtask] Keep refresh/dom-map fetch; drop SSE reconnect loop and screenshot state
 * [Upstream] fetchRemoteDomMap -> [Downstream] useRemoteSyncBridge (domMap)
 * [Law Check] 45 lines | Passed 100-Line Law
 */
import { useCallback, useState } from 'react';
import { fetchRemoteDomMap, RemoteDomMapResponse } from './remote-mirror.service';

interface RemoteMirrorState {
    domMap:    unknown[];
    viewport:  RemoteDomMapResponse['viewport'] | null;
    lastError: string | null;
}

export const useRemoteMirror = (
    baseUrl: string,
    tabId: string,
    url: string | undefined,
    enabled: boolean,
) => {
    const [state, setState] = useState<RemoteMirrorState>({
        domMap:    [],
        viewport:  null,
        lastError: null,
    });

    // Why: DOM map is a full Playwright scan — only fetch on demand (before AI action).
    // Screenshot frames come via the shared WebSocket (see useTabSyncSocket frame events).
    const refresh = useCallback(async () => {
        if (!enabled || !baseUrl) return;
        try {
            const dom = await fetchRemoteDomMap(baseUrl, tabId, url);
            setState({
                domMap:    Array.isArray(dom.map) ? dom.map : [],
                viewport:  dom.viewport,
                lastError: null,
            });
        } catch (e) {
            setState(prev => ({ ...prev, lastError: e instanceof Error ? e.message : String(e) }));
        }
    }, [baseUrl, enabled, tabId, url]);

    return { ...state, refresh };
};
