// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Core Browser
 * [Child Task/Issue] useSentientBrowser refactor
 * [Subtask] Remote sync & mission execution bridge orchestration
 * [Upstream] Browser state -> [Downstream] Remote mirror + mission executor
 * [Law Check] 42 lines | Passed 100-Line Law
 */
import { useEffect, useMemo, useRef } from 'react';
import { useRemoteMirror } from '../../features/remote-mirror/useRemoteMirror';
import { sendRemoteAction } from '../../features/remote-mirror/remote-mirror.service';
import { useMissionExecutorBridge } from '../useMissionExecutorBridge';

/** Remote mirror & mission executor bridge orchestration */
export const useRemoteSyncBridge = (
    webViewRef: React.RefObject<any>,
    isRemoteMirrorEnabled: boolean,
    PROXY_BASE_URL: string,
    activeTabId: string | undefined,
    activeUrl: string,
    setStatusMessage: (msg: string) => void,
    setActivePrompt: (p: string) => void,
    setActiveUrl: (url: string) => void,
    updateTask: (id: string, status: string, details?: string) => void,
    handleDomMapReceived: (map: any) => void,
) => {
    const remoteMirror = useRemoteMirror(PROXY_BASE_URL, activeTabId || 'default', activeUrl, isRemoteMirrorEnabled);

    const remoteActions = useMemo(() => (
        isRemoteMirrorEnabled
            ? {
                executeAction: async (action: 'click' | 'type', targetId: string | undefined, value?: string, ariaSelector?: { role?: string; name?: string; text?: string }) => {
                    await sendRemoteAction(PROXY_BASE_URL, activeTabId || 'default', activeUrl, action, targetId, value, ariaSelector);
                },
            }
            : undefined
    ), [isRemoteMirrorEnabled, PROXY_BASE_URL, activeTabId, activeUrl]);

    useMissionExecutorBridge({
        webViewRef,
        isRemoteMirrorEnabled,
        setStatusMessage,
        setActivePrompt,
        setActiveUrl,
        updateTask,
        remoteActions,
    });

    useEffect(() => {
        if (!isRemoteMirrorEnabled || !remoteMirror.domMap.length) return;
        handleDomMapReceived(remoteMirror.domMap);
    }, [isRemoteMirrorEnabled, remoteMirror.domMap, handleDomMapReceived]);

    return { remoteMirror, remoteActions };
};
