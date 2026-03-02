// Feature: Core | Why: Manual browser controls — prompt execution, daemon toggle, reload
import React from 'react';
import { HeadlessWebViewRef } from '../features/browser/browser.headless-webview.component';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../features/background-tasks/background-scanner.service';
import { auth } from '../features/auth/firebase-config';
import { getSchemaPayload } from '@features/planning';
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
    const handleExecutePrompt = async (prompt: string, tabId: string, _userId: string, useConfirmerAgent = true) => {
        const runId = `run_${Date.now()}`;
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
                console.info('[Planner] source=remote endpoint=/agent/plan status=ok');
            } else {
                const errText = await response.text().catch(() => '');
                llmError = `LLM endpoint error: ${response.status}${errText ? ` ${errText}` : ''}`;
            }
        } catch (e) { llmError = e instanceof Error ? e.message : String(e); }

        // 2. Do NOT fallback to a local planner.
        // Why: a second planner implementation creates divergent plans vs container runtime,
        // which desynchronizes the UI task queue from backend execution state.
        if (!missionResponse) {
            console.error(`[Planner] source=remote status=failed reason=${llmError || 'remote_unavailable'}`);
            setStatusMessage(`Planner unavailable: ${llmError || 'unknown error'}`);
            return;
        }

        // 3. Build mission tasks
        if (missionResponse?.execution?.segments) {
            await buildMissionFromSegments(prompt, missionResponse, llmError, tabId, runId, { addTask, setStatusMessage, useConfirmerAgent });
        } else {
            setStatusMessage('Planner returned invalid mission format');
            return;
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
