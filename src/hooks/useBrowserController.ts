// Feature: Core | Trace: README.md
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../features/background-tasks/background-scanner.service';
import { planTaskBreakdown } from '../features/llm/llm-task-planner.engine';

import { useCallback } from 'react';

/**
 * useBrowserController: Encapsulates manual controls like executing prompts and toggling the daemon.
 */
export const useBrowserController = (
    webViewRefs: React.MutableRefObject<Record<string, HeadlessWebViewRef>>,
    activeTabId: string,
    addTask: (d: string, s: any) => string,
    setActivePrompt: (p: string) => void,
    setTaskStartTime: (t: number) => void,
    setStatusMessage: (m: string) => void,
    setIsPaused: (p: boolean) => void,
    isDaemonRunning: boolean,
    setIsDaemonRunning: (r: boolean) => void,
    clearTasks: () => void,
    geminiApiKey: string | undefined,
    setGlobalObjective: (o: string) => void
) => {
    const handleExecutePrompt = useCallback(async (prompt: string) => {
        setGlobalObjective(prompt);
        setTaskStartTime(Date.now());
        
        setStatusMessage('AI Planning Tasks...');
        
        const plan = await planTaskBreakdown(prompt, geminiApiKey);
        
        clearTasks(); // clear previous tasks

        if (plan && plan.tasks && plan.tasks.length > 0) {
            for (const task of plan.tasks) {
                addTask(task, 'pending');
            }
        } else {
             // Fallback if planner fails
            await addTask(`Execute: "${prompt}"`, 'pending');
        }

        setIsPaused(false);
    }, [setGlobalObjective, setTaskStartTime, setStatusMessage, geminiApiKey, clearTasks, addTask, setIsPaused]);

    const toggleDaemon = useCallback(async () => {
        if (isDaemonRunning) await unregisterBackgroundFetchAsync();
        else await registerBackgroundFetchAsync();
        setIsDaemonRunning(!isDaemonRunning);
    }, [isDaemonRunning, setIsDaemonRunning]);

    return { handleExecutePrompt, toggleDaemon };
};
