// Feature: Core | Trace: README.md
import { useState, useRef, useCallback } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { determineNextAction } from '../features/llm/llm-decision.engine';
import { SurveyOrchestrator } from '../features/surveys/surveys.orchestrator';
import { db, auth } from '../features/auth/firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeForCloud } from '../utils/safe-cloud.utils';
import { recordAnswer } from '../features/surveys/survey-memory-db';
import * as Haptics from 'expo-haptics';

export const useDomDecision = (
    activePrompt: string,
    activeUrl: string,
    retryCount: number,
    setRetryCount: (n: number) => void,
    updateTask: (id: string, s: any, d?: string) => void,
    workflowIds: string[],
    webViewRef: React.RefObject<HeadlessWebViewRef>,
    setBlockedReason: (r: string) => void,
    setIsBlockedModalVisible: (v: boolean) => void,
    setStatusMessage: (m: string) => void,
    setIsPaused: (p: boolean) => void,
    handleCreateIssue: (t: string, b: string) => void,
    handleRecordKnowledge: (p: string, k: string) => void,
    handleLookupDocumentation: (q: string) => Promise<any[]>,
    lookedUpDocs: any[],
    setLookedUpDocs: (docs: any[]) => void,
    setInteractiveRequest: (req: { question: string, type: 'confirm' | 'input' } | null) => void,
    setIsInteractiveModalVisible: (v: boolean) => void,
    PROXY_BASE_URL: string,
    isScholarMode: boolean = false
) => {
    const handleDomMapReceived = useCallback(async (map: any) => {
        if (!activePrompt) return;
        try {
            const isLoginPage = map.some((n: any) =>
                n.text?.toLowerCase().includes('sign in') || n.attributes?.type === 'password'
            );

            if (isLoginPage) {
                setStatusMessage('Auth Required');
                setIsPaused(true);
                setBlockedReason('A security wall (Login) has been detected.');
                setIsBlockedModalVisible(true);
                return;
            }

            if (activePrompt.includes('Swagbucks: Survey Sweeper')) {
                const bestSurvey = SurveyOrchestrator.evaluateDashboard(map);
                if (bestSurvey) webViewRef.current?.executeAction('click', bestSurvey.id);
            } else {
                let screenshotBase64 = '';
                if (retryCount > 0) {
                    const snapResponse = await fetch(`${PROXY_BASE_URL}/screenshot?url=${encodeURIComponent(activeUrl)}`);
                    const snapData = await snapResponse.json();
                    screenshotBase64 = snapData.screenshot;
                }

                const decision = await determineNextAction(activePrompt, map, screenshotBase64, new URL(activeUrl).hostname, lookedUpDocs, isScholarMode);
                if (decision) {
                    await addDoc(collection(db, 'thoughts'), sanitizeForCloud({
                        user_id: auth.currentUser?.uid || 'anonymous',
                        prompt: activePrompt,
                        reasoning: decision.reasoning,
                        action: decision.action,
                        timestamp: serverTimestamp()
                    }));

                    if (decision.action === 'ask_user' && decision.value) {
                        setInteractiveRequest({ question: decision.value, type: decision.value.includes('?') ? 'confirm' : 'input' });
                        setIsInteractiveModalVisible(true);
                        setIsPaused(true);
                        setStatusMessage('Awaiting Input');
                        return;
                    }

                    if (decision.action === 'create_github_issue' && decision.value) {
                        handleCreateIssue(`AI Browser Bug: ${activeUrl}`, decision.value);
                    }

                    if (decision.action === 'record_knowledge' && decision.value) {
                        const path = `knowledge/${new URL(activeUrl).hostname}.md`;
                        handleRecordKnowledge(path, decision.value);
                    }

                    if (decision.action === 'lookup_documentation' && decision.value) {
                        const docs = await handleLookupDocumentation(decision.value);
                        if (docs.length > 0) {
                            setLookedUpDocs(docs);
                            setStatusMessage(`Found ${docs.length} docs`);
                        }
                    }

                    if (decision.action === 'type' && decision.value) {
                        await recordAnswer(activePrompt, decision.value);
                    }

                    if (decision.targetId) webViewRef.current?.executeAction(decision.action as any, decision.targetId, decision.value);
                }
            }
        } catch (e) { console.error("Decision failure", e); }
    }, [activePrompt, activeUrl, retryCount, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, PROXY_BASE_URL, lookedUpDocs, isScholarMode, handleCreateIssue, handleRecordKnowledge, handleLookupDocumentation, setLookedUpDocs, webViewRef]);

    return { handleDomMapReceived };
};
