// Feature: Core | Trace: README.md
// Enhanced with web-ui-1 pattern: pre-scan view clearing pipeline
import { useEffect, useRef } from 'react';
import { HeadlessWebViewRef } from '@features/browser';
import { VIEW_CLEARING_STAGES } from '../features/browser/services/view-clearing.pipeline';

/**
 * useDomAutoScanner: Periodic DOM scanning when AI mode is active.
 * Now runs view-clearing pipeline before each scan (web-ui-1's clear_view pattern).
 * Uses ref for isThinking to avoid stale closure in setInterval.
 */
export const useDomAutoScanner = (
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    isAIMode: boolean,
    isPaused: boolean,
    activePrompt: string,
    setStatusMessage: (m: string) => void,
    isThinking: boolean
) => {
    // Ref keeps interval closure current — avoids scans during LLM processing
    const thinkingRef = useRef(isThinking);
    thinkingRef.current = isThinking;

    useEffect(() => {
        let interval: any;
        if (isAIMode && !isPaused && activePrompt) {
            interval = setInterval(async () => {
                if (thinkingRef.current) return;

                // Pre-scan: run view-clearing stages 1-4 to remove overlays (web-ui-1 pattern)
                try {
                    for (const stage of VIEW_CLEARING_STAGES.slice(0, 4)) {
                        webViewRef.current?.injectJavaScript?.(stage.script);
                    }
                } catch { /* best-effort cleanup */ }

                webViewRef.current?.scanDOM();
            }, 10000);
        } else {
            setStatusMessage(isPaused ? 'Paused' : 'Ready');
        }
        return () => clearInterval(interval);
    }, [activePrompt, isAIMode, isPaused]);
};
