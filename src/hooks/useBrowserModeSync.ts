// Feature: Core | Trace: README.md
import { useEffect } from 'react';
import { detectModeFromUrl } from '../utils/mode-detector';

export const useBrowserModeSync = (
    activeUrl: string,
    isRemoteMirrorEnabled: boolean,
    setIsScholarMode: (v: boolean) => void,
    navigateActiveTab: (url: string) => Promise<void>,
): void => {
    useEffect(() => {
        const mode = detectModeFromUrl(activeUrl);
        if (mode === 'scholar') setIsScholarMode(true);
        else if (mode === 'survey') setIsScholarMode(false);
    }, [activeUrl, setIsScholarMode]);

    useEffect(() => {
        if (!isRemoteMirrorEnabled) return;
        if (!activeUrl || activeUrl === 'about:blank') navigateActiveTab('https://www.google.com');
    }, [isRemoteMirrorEnabled, activeUrl, navigateActiveTab]);
};
