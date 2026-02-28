// Feature: Core | Why: Manual browser controls — prompt execution, daemon toggle, reload
import React from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../features/background-tasks/background-scanner.service';
import { auth } from '../features/auth/firebase-config';
import { generateMockPlanResponse } from '../utils/prompt-planner';
import { getSchemaPayload } from '../utils/schema-context';
import { TaskItem } from '../features/tasks/types';
import { buildMissionFromSegments } from './mission-builder';

export const useBrowserController = (
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    addTask: (title: string, status: any, details?: string, extra?: Partial<TaskItem>) => Promise<any>,
    setActivePrompt: (p: string) => void,
    setTaskStartTime: (t: number) => void,
    setStatusMessage: (m: string) => void,
    setIsPaused: (p: boolean) => void,
    isDaemonRunning: boolean,
    setIsDaemonRunning: (r: boolean) => void,
    PROXY_BASE_URL: string
) => {
    const handleExecutePrompt = async (prompt: string, tabId: string, _userId: string) => {
        setActivePrompt(prompt);
        setTaskStartTime(Date.now());

        // 1. Call cloud LLM for mission planning
        let missionResponse: any = null;
        let llmError: string | null = null;

        try {
            const token = await auth.currentUser?.getIdToken();
            const response = await fetch(`${PROXY_BASE_URL}/agent/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || 'anonymous'}` },
                body: JSON.stringify({ prompt, tabId, ...getSchemaPayload() }),
            });
            if (response.ok) {
                const data = await response.json();
                missionResponse = data.missionResponse || data;
            } else { llmError = `LLM endpoint error: ${response.status}`; }
        } catch (e) { llmError = e instanceof Error ? e.message : String(e); }

        // 2. Fallback to local planner
        if (!missionResponse) {
            missionResponse = generateMockPlanResponse(prompt).missionResponse;
        }

        // 3. Build mission tasks or single fallback task
        if (missionResponse?.execution?.segments) {
            await buildMissionFromSegments(prompt, missionResponse, llmError, tabId, { addTask, setStatusMessage });
        } else {
            await addTask(`Execute: ${prompt}`, 'pending', 'Awaiting execution');
            setStatusMessage('Task created — awaiting execution');
        }

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
        webViewRef.current?.scanDOM();
    };

    return { handleExecutePrompt, toggleDaemon, handleReload };
};
