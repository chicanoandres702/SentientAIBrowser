import { useEffect } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';

/**
 * useDomAutoScanner: Encapsulates the periodic DOM scanning logic.
 * Scans the DOM every 5 seconds when AI mode is active and not paused.
 */
export const useDomAutoScanner = (
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    isAIMode: boolean,
    isPaused: boolean,
    activePrompt: string,
    setStatusMessage: (m: string) => void
) => {
    useEffect(() => {
        let interval: any;
        if (isAIMode && !isPaused && activePrompt) {
            interval = setInterval(() => webViewRef.current?.scanDOM(), 5000);
        } else {
            setStatusMessage(isPaused ? 'Paused' : 'Ready');
        }
        return () => clearInterval(interval);
    }, [activePrompt, isAIMode, isPaused]);
};
