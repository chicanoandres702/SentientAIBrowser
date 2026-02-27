// Feature: Core | Trace: README.md
import { useState, useRef, useCallback } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { determineNextAction } from '../features/llm/llm-decision.engine';
import { SurveyOrchestrator } from '../features/surveys/surveys.orchestrator';
import { db, auth } from '../features/auth/firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeForCloud } from '../../shared/safe-cloud.utils';
import { recordAnswer } from '../../shared/survey-memory-db';
import { saveContextualKnowledge } from '../features/llm/knowledge-hierarchy.service';
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
    lookedUpDocs: any[],
    setLookedUpDocs: (docs: any[]) => void,
    setInteractiveRequest: (req: { question: string, type: 'confirm' | 'input' } | null) => void,
    setIsInteractiveModalVisible: (v: boolean) => void,
    isThinking: boolean,
    setIsThinking: (t: boolean) => void,
    PROXY_BASE_URL: string,
    isScholarMode: boolean = false
) => {
    const handleDomMapReceived = useCallback(async (map: any) => {
        if (!activePrompt || isThinking) return;
        setIsThinking(true);
        setStatusMessage('Thinking...');
        try {
            const isLoginPage = map.some((n: any) =>
                n.text?.toLowerCase().includes('sign in') || n.attributes?.type === 'password'
            );

            if (isLoginPage) {
                setStatusMessage('Auth Required');
                setIsPaused(true);
                setBlockedReason('A security wall (Login) has been detected.');
                setIsBlockedModalVisible(true);
                setIsThinking(false);
                return;
            }

            if (activePrompt.includes('Swagbucks: Survey Sweeper')) {
                const bestSurvey = SurveyOrchestrator.evaluateDashboard(map);
                if (bestSurvey) {
                    setStatusMessage('Selecting Survey...');
                    webViewRef.current?.executeAction('click', bestSurvey.id);
                }
            } else {
                let screenshotBase64 = '';
                if (retryCount > 0) {
                    const snapResponse = await fetch(`${PROXY_BASE_URL}/screenshot?url=${encodeURIComponent(activeUrl)}`);
                    const snapData = await snapResponse.json();
                    screenshotBase64 = snapData.screenshot;
                }

                const response = await determineNextAction(activePrompt, map, screenshotBase64, new URL(activeUrl).hostname, lookedUpDocs, isScholarMode);
                if (response) {
                    await addDoc(collection(db, 'thoughts'), sanitizeForCloud({
                        user_id: auth.currentUser?.uid || 'anonymous',
                        prompt: activePrompt,
                        reasoning: response.meta.reasoning,
                        intelligenceRating: response.meta.intelligenceRating,
                        intelligenceSignals: response.meta.intelligenceSignals || [],
                        action: response.execution.segments[0]?.steps[0]?.action || 'none',
                        timestamp: serverTimestamp()
                    }));

                    // For the frontend hook, we execute the first step of the first segment
                    const firstStep = response.execution.segments[0]?.steps[0];
                    if (!firstStep) return;

                    if (firstStep.action === 'ask_user' && firstStep.value) {
                        setInteractiveRequest({ question: firstStep.value, type: firstStep.value.includes('?') ? 'confirm' : 'input' });
                        setIsInteractiveModalVisible(true);
                        setIsPaused(true);
                        setStatusMessage('Awaiting Input');
                        setIsThinking(false);
                        return;
                    }

                    if (firstStep.action === 'lookup_documentation' && firstStep.value) {
                        setStatusMessage('Docs lookup disabled');
                    }

                    if (firstStep.action === 'type' && firstStep.value) {
                        await recordAnswer(activePrompt, firstStep.value);
                    }

                    if (firstStep.action === 'record_knowledge' && firstStep.value) {
                        setStatusMessage('Saving Brain Data...');
                        const targetContext = {
                            contextId: new URL(activeUrl).hostname,
                            ...(firstStep.knowledgeContext || {})
                        };
                        await saveContextualKnowledge(
                            auth.currentUser?.uid || 'anonymous',
                            targetContext,
                            'rule',
                            firstStep.value
                        );
                        // After recording, we still want to proceed to the next available action if any
                    }

                    if (firstStep.targetId) {
                        setStatusMessage(`Executing: ${firstStep.action}...`);
                        webViewRef.current?.executeAction(firstStep.action as any, firstStep.targetId, firstStep.value);
                    } else if (firstStep.action === 'wait') {
                        setStatusMessage('Waiting...');
                        await new Promise(r => setTimeout(r, 2000));
                    } else if (firstStep.action === 'done') {
                        setStatusMessage('Task Complete');
                    }
                }
            }
        } catch (e) {
            console.error("Decision failure", e);
            setStatusMessage('Retry required');
        } finally {
            setIsThinking(false);
        }
    }, [activePrompt, activeUrl, retryCount, setStatusMessage, setIsPaused, setBlockedReason, setIsBlockedModalVisible, PROXY_BASE_URL, lookedUpDocs, isScholarMode, setLookedUpDocs, webViewRef, isThinking, setIsThinking]);

    return { handleDomMapReceived };
};
