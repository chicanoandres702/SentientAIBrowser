// Feature: Core | Trace: README.md
import React from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../features/background-tasks/background-scanner.service';
import { auth } from '../features/auth/firebase-config';

/**
 * useBrowserController: Encapsulates manual controls like executing prompts and toggling the daemon.
 */
export const useBrowserController = (
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    addTask: (title: string, status: any, details?: string) => Promise<any>,
    setActivePrompt: (p: string) => void,
    setTaskStartTime: (t: number) => void,
    setStatusMessage: (m: string) => void,
    setIsPaused: (p: boolean) => void,
    isDaemonRunning: boolean,
    setIsDaemonRunning: (r: boolean) => void,
    PROXY_BASE_URL: string
) => {
    const handleExecutePrompt = async (prompt: string, tabId: string, userId: string) => {
        setActivePrompt(prompt);
        setTaskStartTime(Date.now());

        // 1. Initial acknowledgment task
        await addTask(`Mission: "${prompt}"`, 'in_progress');

        // 2. Cloud Planning: Offload mission start to server
        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${PROXY_BASE_URL}/agent/plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || 'anonymous'}`
                },
                body: JSON.stringify({ prompt, tabId })
            });

            if (!response.ok) throw new Error('Cloud Planning Failed');
            const { missionResponse } = await response.json();

            // 3. Populate visual task queue from segments and steps
            if (missionResponse?.execution.segments) {
                for (const segment of missionResponse.execution.segments) {
                    for (const step of segment.steps) {
                        await addTask(step.explanation, 'pending', `Action: ${step.action}`);
                    }
                }
            }
        } catch (e) {
            console.error("Mission Start Failed", e);
            setStatusMessage('Planning Failed');
            await addTask('Failed to generate plan', 'failed');
            return;
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
