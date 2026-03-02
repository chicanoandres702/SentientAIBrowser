// Feature: Core | Trace: README.md
import { useEffect } from 'react';
import { detectModeFromUrl } from '@features/missions/missions.mode-detector.service';

export const useBrowserModeSync = (
    activeUrl: string,
    isRemoteMirrorEnabled: boolean,
    setIsScholarMode: (v: boolean) => void,
): void => {
    useEffect(() => {
        const mode = detectModeFromUrl(activeUrl);
        if (mode === 'scholar') setIsScholarMode(true);
        else if (mode === 'survey') setIsScholarMode(false);
    }, [activeUrl, setIsScholarMode]);

};
