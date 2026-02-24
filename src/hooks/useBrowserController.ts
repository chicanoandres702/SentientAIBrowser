import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../features/background-tasks/background-scanner.service';

/**
 * useBrowserController: Encapsulates manual controls like executing prompts and toggling the daemon.
 */
export const useBrowserController = (
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    addTask: (d: string, s: any) => Promise<any>,
    setActivePrompt: (p: string) => void,
    setTaskStartTime: (t: number) => void,
    setStatusMessage: (m: string) => void,
    setIsPaused: (p: boolean) => void,
    isDaemonRunning: boolean,
    setIsDaemonRunning: (r: boolean) => void
) => {
    const handleExecutePrompt = async (prompt: string) => {
        setActivePrompt(prompt);
        setTaskStartTime(Date.now());
        await addTask(`Execute: "${prompt}"`, 'in_progress');
        setStatusMessage('AI Analyzing Page...');
        webViewRef.current?.scanDOM();
        setIsPaused(false);
    };

    const toggleDaemon = async () => {
        if (isDaemonRunning) await unregisterBackgroundFetchAsync();
        else await registerBackgroundFetchAsync();
        setIsDaemonRunning(!isDaemonRunning);
    };

    return { handleExecutePrompt, toggleDaemon };
};
