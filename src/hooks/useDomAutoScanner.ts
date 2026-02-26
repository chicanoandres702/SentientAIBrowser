// Feature: Core | Trace: README.md
// Why: 10s scan interval (was 5s) halves CPU cost with negligible impact on AI responsiveness.
import { useEffect } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';

const DOM_SCAN_INTERVAL_MS = 10_000; // 10s — frequent enough for survey AI loop

export const useDomAutoScanner = (
    webViewRefs: React.MutableRefObject<Record<string, HeadlessWebViewRef>>,
    groups: any[],
    isAIMode: boolean
) => {
    useEffect(() => {
        if (!isAIMode) return;

        const interval = setInterval(() => {
            groups.flatMap(g => g.tabs).forEach(tab => {
                if (tab.activePrompt && !tab.isPaused) {
                    webViewRefs.current[tab.id]?.scanDOM();
                }
            });
        }, DOM_SCAN_INTERVAL_MS);
        
        return () => clearInterval(interval);
    }, [groups, isAIMode]);
};
