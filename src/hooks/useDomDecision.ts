// Feature: Core | Trace: README.md
import { useCallback, useRef } from 'react';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { determineNextAction } from '../features/llm/llm-decision.engine';
import { SurveyOrchestrator } from '../features/surveys/surveys.orchestrator';
import { db, auth } from '../features/auth/firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sanitizeForCloud } from '../utils/safe-cloud.utils';
import { recordAnswer } from '../features/surveys/survey-memory-db';
import { useThoughtSession } from './useThoughtSession';

const TASK_COMPLETE_QUESTION = 'Did the AI complete this task correctly? Tap Yes to keep the learned moves, No to discard them.';

export const useDomDecision = (
    groups: any[],
    setTabState: (id: string, s: any) => void,
    updateTask: (id: string, s: any, d?: string) => void,
    tasks: any[],
    webViewRefs: React.MutableRefObject<Record<string, HeadlessWebViewRef>>,
    setBlockedReason: (r: string) => void,
    setIsBlockedModalVisible: (v: boolean) => void,
    lookedUpDocs: any[],
    setLookedUpDocs: (docs: any[]) => void,
    PROXY_BASE_URL: string,
    isScholarMode: boolean = false,
    geminiApiKey: string,
    setIsInteractiveModalVisible: (v: boolean) => void,
    setInteractiveRequest: (r: { question: string; type: string } | null) => void,
    setOnInteractiveResponse: (fn: ((confirmed: boolean) => void) | null) => void,
    handleReassessPlan: (reasoning: string) => void
) => {
    const { addThought, commitSession, clearSession } = useThoughtSession();

    // Why: prompts user for feedback then applies RL cleanup to Firestore
    const triggerFeedbackLoop = useCallback(() => {
        setInteractiveRequest({ question: TASK_COMPLETE_QUESTION, type: 'confirm' });
        setIsInteractiveModalVisible(true);
        setOnInteractiveResponse((confirmed: boolean) => {
            if (confirmed) commitSession();
            clearSession();
        });
    }, [commitSession, clearSession, setInteractiveRequest, setIsInteractiveModalVisible, setOnInteractiveResponse]);

    const processingTabs = useRef<Set<string>>(new Set());

    const handleDomMapReceived = useCallback(async (map: any, tabId: string) => {
        if (processingTabs.current.has(tabId)) {
            // Already asking the LLM for a decision for this tab, drop this scan.
            return;
        }

        const tab = groups.map(g => g.tabs).flat().find(t => t.id === tabId);
        if (!tab || !tab.activePrompt) return;
        
        const activePrompt = tab.activePrompt;
        const activeUrl = tab.url;
        const retryCount = tab.retryCount || 0;

        try {
            processingTabs.current.add(tabId);

            if (activePrompt.includes('Swagbucks: Survey Sweeper')) {
                const bestSurvey = SurveyOrchestrator.evaluateDashboard(map);
                if (bestSurvey) webViewRefs.current[tabId]?.executeAction('click', bestSurvey.id);
            } else {
                let screenshotBase64 = '';
                if (retryCount > 0) {
                    const snapResponse = await fetch(`${PROXY_BASE_URL}/screenshot?url=${encodeURIComponent(activeUrl)}`);
                    const snapData = await snapResponse.json();
                    screenshotBase64 = snapData.screenshot;
                }

                const decision = await determineNextAction(activePrompt, map, screenshotBase64, new URL(activeUrl).hostname, lookedUpDocs, isScholarMode, geminiApiKey);
                if (decision) {
                    // Write thought to Firestore (dev only) and track the doc ID
                    if (__DEV__) {
                        const docRef = await addDoc(collection(db, 'thoughts'), sanitizeForCloud({
                            user_id: auth.currentUser?.uid || 'anonymous',
                            prompt: activePrompt,
                            reasoning: decision.reasoning,
                            action: decision.action,
                            timestamp: serverTimestamp()
                        }));
                        addThought(docRef.id, retryCount > 0);
                    }

                    if (decision.action === 'done') {
                        const inProgressTask = tasks.find(t => t.status === 'in_progress');
                        if (inProgressTask) {
                            updateTask(inProgressTask.id, 'completed');
                            // Why: clear activePrompt only — the task consumer loop in
                            // useSentientBrowser.ts reactively picks up the next pending task.
                            // Do NOT check tasks.filter here: 'tasks' is stale in this closure.
                            setTabState(tabId, { activePrompt: '', statusMessage: 'Step Complete' });
                        } else {
                            // No task queue was running — treat as a standalone completion.
                            setTabState(tabId, { statusMessage: 'Task Complete', isPaused: true });
                            triggerFeedbackLoop();
                        }
                        return;
                    }

                    if (decision.action === 'create_github_issue' && decision.value) {
                        fetch(`${PROXY_BASE_URL}/git/create-issue`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title: `AI Browser Bug: ${activeUrl}`, body: decision.value })
                        }).catch(e => console.error("Failed to proxy issue creation:", e));
                    }
                    if (decision.action === 'record_knowledge' && decision.value) {
                        fetch(`${PROXY_BASE_URL}/git/record-knowledge`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: `knowledge/${new URL(activeUrl).hostname}.md`, knowledge: decision.value })
                        }).catch(e => console.error("Failed to proxy knowledge recording:", e));
                    }
                    if (decision.action === 'lookup_documentation' && decision.value) {
                        fetch(`${PROXY_BASE_URL}/git/lookup-docs?query=${encodeURIComponent(decision.value)}`)
                            .then(r => r.json())
                            .then(docs => {
                                if (docs.length > 0) {
                                    setLookedUpDocs(docs);
                                    setTabState(tabId, { statusMessage: `Found ${docs.length} docs` });
                                }
                            }).catch(e => console.error("Failed to proxy docs lookup:", e));
                    }
                    if (decision.action === 'navigate' && decision.value) {
                        let navUrl = decision.value.trim();
                        if (!navUrl.startsWith('http://') && !navUrl.startsWith('https://')) {
                            navUrl = 'https://' + navUrl;
                        }
                        setTabState(tabId, { url: navUrl, statusMessage: `Navigating to ${navUrl}` });
                    }
                    if (decision.action === 'type' && decision.value) {
                        await recordAnswer(activePrompt, decision.value);
                    }
                    if (decision.targetId && (decision.action === 'click' || decision.action === 'type')) {
                        webViewRefs.current[tabId]?.executeAction(decision.action as any, decision.targetId, decision.value);
                    }
                }
            }
        } catch (e) {
            console.error('Decision failure', e);
        } finally {
            processingTabs.current.delete(tabId);
        }
    }, [groups, setTabState, setBlockedReason, setIsBlockedModalVisible, PROXY_BASE_URL, lookedUpDocs, isScholarMode, setLookedUpDocs, webViewRefs, geminiApiKey, addThought, triggerFeedbackLoop, handleReassessPlan]);

    return { handleDomMapReceived };
};
