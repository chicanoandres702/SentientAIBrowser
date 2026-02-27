// Feature: Core | Trace: README.md
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../features/background-tasks/background-scanner.service';
import { AgentService } from '../features/agent/AgentService';

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
    const handleExecutePrompt = async (prompt: string, tabId: string, userId: string) => {
        setActivePrompt(prompt);
        setTaskStartTime(Date.now());
        
        // 1. Initial acknowledgment task
        await addTask(`Mission: "${prompt}"`, 'in_progress');
        
        // 2. Register mission and get high-fidelity plan
        const { missionResponse } = await AgentService.startMission(prompt, tabId);

        // 3. Populate visual task queue from segments and steps
        if (missionResponse?.execution.segments) {
            for (const segment of missionResponse.execution.segments) {
                for (const step of segment.steps) {
                    await addTask(step.explanation, 'pending', `Action: ${step.action}`);
                }
            }
        }

        setStatusMessage('AI Starting Tactical Execution...');
        webViewRef.current?.scanDOM();
        setIsPaused(false);
    };

    const toggleDaemon = async () => {
        if (isDaemonRunning) await unregisterBackgroundFetchAsync();
        else await registerBackgroundFetchAsync();
        setIsDaemonRunning(!isDaemonRunning);
    };

    const handleReload = () => {
        webViewRef.current?.reload();
        webViewRef.current?.scanDOM(); // Re-scan after reload intent
    };

    return { handleExecutePrompt, toggleDaemon, handleReload };
};
