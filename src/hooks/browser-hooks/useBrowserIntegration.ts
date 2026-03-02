// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Core Browser
 * [Child Task/Issue] useSentientBrowser refactor
 * [Subtask] Feature integrations - heuristics, sessions, knowledge, cursor, manual control
 * [Upstream] Browser capabilities -> [Downstream] Feature bridges
 * [Law Check] 60 lines | Passed 100-Line Law
 */
import { useCallback, useRef } from 'react';
import { useAgentHeuristics } from '../useAgentHeuristics';
import { useUrlTracker } from '../useUrlTracker';
import { useCursorController } from '../useCursorController';
import { useSessionSync } from '../../features/browser/hooks/useSessionSync';
import { useKnowledgeSync } from '../../features/browser/hooks/useKnowledgeSync';
import { useNavigationController } from '../useNavigationController';
import { useManualInput } from '../../features/browser-control';
import { sendRemoteCoordClick, sendMouseMove, sendMouseScroll } from '../../features/remote-mirror/remote-mirror.service';

/** Feature integrations - heuristics, sessions, knowledge, cursor, navigation, manual control */
export const useBrowserIntegration = (
    activeUrl: string,
    activeTabId: string | undefined,
    navigateActiveTab: (url: string) => Promise<void>,
    setTasks: (fn: any) => void,
    tasks: any[],
    proxyBaseUrl: string,
) => {
    const { preStepCheck, postStepRecord, resetHeuristics } = useAgentHeuristics();
    const { session, persistSession } = useSessionSync();
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';
    const { entries: knowledgeEntries, addEntry: addKnowledge } = useKnowledgeSync(activeHost);
    const { navigateWithGuard, navigateBack, navigateForward } = useNavigationController(
        proxyBaseUrl,
        activeTabId || 'default', 
        navigateActiveTab
    );
    const previewWidth = Math.min(window.innerWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const { cursor, updateDomMap, animateClick, animateType, hideCursor, clickAt, showAt } = useCursorController(previewWidth, previewHeight);
    const cursorActions = { animateClick, animateType, hideCursor };
    const mouseThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useUrlTracker(activeUrl, tasks.map(t => t.id), []);

    const { handleManualType, handleManualKeyPress } = useManualInput({ PROXY_BASE_URL: proxyBaseUrl, activeTabId });

    // Why: scale UI container coords → Playwright viewport coords (1280×800) then send to proxy.
    // clickAt() animates the visual cursor; sendRemoteCoordClick() fires the real Playwright click.
    const handleManualClick = useCallback(
        async (x: number, y: number, cW: number, cH: number): Promise<void> => {
            const s = Math.min(cW / 1280, cH / 800);
            const ox = (cW - 1280 * s) / 2; const oy = (cH - 800 * s) / 2;
            const px = Math.round(Math.max(0, Math.min((x - ox) / s, 1280)));
            const py = Math.round(Math.max(0, Math.min((y - oy) / s, 800)));
            clickAt(ox + px * s, oy + py * s);
            if (proxyBaseUrl && activeTabId) await sendRemoteCoordClick(proxyBaseUrl, activeTabId, px, py);
        }, [clickAt, proxyBaseUrl, activeTabId]);

    const handleManualMouseMove = useCallback(
        (x: number, y: number, cW: number, cH: number): void => {
            showAt(x, y); // animate visual cursor on every throttled event
            if (!proxyBaseUrl || !activeTabId || mouseThrottleRef.current) return;
            const sc = Math.min(cW / 1280, cH / 800);
            const ox = (cW - 1280 * sc) / 2; const oy = (cH - 800 * sc) / 2;
            const px = Math.round(Math.max(0, Math.min((x - ox) / sc, 1280)));
            const py = Math.round(Math.max(0, Math.min((y - oy) / sc, 800)));
            mouseThrottleRef.current = setTimeout(() => { mouseThrottleRef.current = null; }, 80);
            sendMouseMove(proxyBaseUrl, activeTabId, px, py);
        }, [showAt, proxyBaseUrl, activeTabId]);

    const handleManualScroll = useCallback(
        (deltaX: number, deltaY: number): void => {
            if (proxyBaseUrl && activeTabId) sendMouseScroll(proxyBaseUrl, activeTabId, deltaX, deltaY);
        }, [proxyBaseUrl, activeTabId]);

    return {
        heuristics: { preStepCheck, postStepRecord, resetHeuristics },
        session: { session, persistSession },
        knowledge: { knowledgeEntries, addKnowledge },
        navigation: { navigateWithGuard, navigateBack, navigateForward },
        cursor: { cursor, updateDomMap, cursorActions },
        manual: { handleManualClick, handleManualType, handleManualKeyPress, handleManualMouseMove, handleManualScroll },
    };
};
