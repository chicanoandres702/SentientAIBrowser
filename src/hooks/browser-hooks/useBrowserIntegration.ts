// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Core Browser
 * [Child Task/Issue] useSentientBrowser refactor
 * [Subtask] Feature integrations - heuristics, sessions, knowledge, cursor, manual control
 * [Upstream] Browser capabilities -> [Downstream] Feature bridges
 * [Law Check] 60 lines | Passed 100-Line Law
 */
import { useRef, useCallback } from 'react';
import { auth } from '../../features/auth/firebase-config';
import { useAgentHeuristics } from '../useAgentHeuristics';
import { useUrlTracker } from '../useUrlTracker';
import { useCursorController } from '../useCursorController';
import { useSessionSync } from '../../features/browser/hooks/useSessionSync';
import { useKnowledgeSync } from '../../features/browser/hooks/useKnowledgeSync';
import { useNavigationController } from '../useNavigationController';
import { useManualClickHandler, useManualInput } from '../../features/browser-control';

/** Feature integrations - heuristics, sessions, knowledge, cursor, navigation, manual control */
export const useBrowserIntegration = (
    activeUrl: string,
    activeTabId: string | undefined,
    navigateActiveTab: (url: string) => Promise<void>,
    setTasks: (fn: any) => void,
    tasks: any[],
) => {
    const { preStepCheck, postStepRecord, resetHeuristics } = useAgentHeuristics();
    const { session, persistSession } = useSessionSync();
    const activeHost = activeUrl ? new URL(activeUrl).hostname : '';
    const { entries: knowledgeEntries, addEntry: addKnowledge } = useKnowledgeSync(activeHost);
    const { navigateWithGuard, navigateBack, navigateForward } = useNavigationController(
        window.location.origin, 
        activeTabId || 'default', 
        navigateActiveTab
    );
    const previewWidth = Math.min(window.innerWidth * 0.7, 1200);
    const previewHeight = previewWidth * 0.6;
    const { cursor, updateDomMap, animateClick, animateType, hideCursor, clickAt } = useCursorController(previewWidth, previewHeight);
    const cursorActions = { animateClick, animateType, hideCursor };

    useUrlTracker(activeUrl, tasks.map(t => t.id), []);

    const { handleManualClick: clickHandler } = useManualClickHandler({ clickAt });
    const handleManualClick = useCallback(
        async (x: number, y: number, containerW: number, containerH: number): Promise<void> => {
            await clickHandler(x, y, containerW, containerH);
        },
        [clickHandler],
    );
    const { handleManualType, handleManualKeyPress } = useManualInput({
        PROXY_BASE_URL: window.location.origin,
        activeTabId,
    });

    return {
        heuristics: { preStepCheck, postStepRecord, resetHeuristics },
        session: { session, persistSession },
        knowledge: { knowledgeEntries, addKnowledge },
        navigation: { navigateWithGuard, navigateBack, navigateForward },
        cursor: { cursor, updateDomMap, cursorActions },
        manual: { handleManualClick, handleManualType, handleManualKeyPress },
    };
};
