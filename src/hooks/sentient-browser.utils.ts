// Feature: Core | Trace: README.md

export const buildWebViewUrl = (
    useProxy: boolean,
    proxyBaseUrl: string,
    activeUrl: string,
    tabId?: string,
): string => {
    if (!useProxy || !proxyBaseUrl) return activeUrl;
    return `${proxyBaseUrl}/proxy?url=${encodeURIComponent(activeUrl)}&tabId=${tabId || 'default'}`;
};

export const applyInteractiveResponse = (
    response: string | boolean,
    setIsInteractiveModalVisible: (v: boolean) => void,
    setIsPaused: (v: boolean) => void,
    setInteractiveRequest: (v: { question: string; type: 'confirm' | 'input' } | null) => void,
    setActivePrompt: (updater: any) => void,
    setStatusMessage: (m: string) => void,
): void => {
    setIsInteractiveModalVisible(false);
    setIsPaused(false);
    setInteractiveRequest(null);
    if (!response) {
        setStatusMessage('Permission Denied');
        return;
    }
    setActivePrompt((prev: string) => `${prev}\n\n[USER RESPONSE]: ${response}`);
    setStatusMessage('Resuming...');
};
