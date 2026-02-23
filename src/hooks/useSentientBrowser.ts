import { useState, useRef, useEffect } from 'react';
import { Alert, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HeadlessWebViewRef } from '../components/HeadlessWebView';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { determineNextAction } from '../services/LLMDecisionEngine';
import { SurveyOrchestrator } from '../features/surveys/surveys.orchestrator';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from '../services/BackgroundScannerService';
import { AppTheme } from '../../App';

export const useSentientBrowser = (theme: AppTheme) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [showWebView, setShowWebView] = useState(true);
    const [isAIMode, setIsAIMode] = useState(true);
    const [useProxy, setUseProxy] = useState(false);
    const [isDaemonRunning, setIsDaemonRunning] = useState(false);
    const [activeUrl, setActiveUrl] = useState('https://www.google.com');
    const [tabs, setTabs] = useState([
        { id: '1', title: 'Google', isActive: true, url: 'https://www.google.com' },
        { id: '2', title: 'Swagbucks', isActive: false, url: 'https://www.swagbucks.com' },
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const [activePrompt, setActivePrompt] = useState<string>('');
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [workflowIds, setWorkflowIds] = useState<string[]>([]);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(isDesktop);
    const [isBlockedModalVisible, setIsBlockedModalVisible] = useState(false);
    const [blockedReason, setBlockedReason] = useState('');
    const [statusMessage, setStatusMessage] = useState('Ready');
    const [isPaused, setIsPaused] = useState(false);
    const [lastInteractionTime, setLastInteractionTime] = useState(0);

    const webViewRef = useRef<HeadlessWebViewRef>(null);

    const trackManualInteraction = () => {
        setLastInteractionTime(Date.now());
        if (!isPaused) {
            setIsPaused(true);
            setStatusMessage('Manual Override: Paused');
        }
    };

    // Autonomous Sentient Loop
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (activePrompt && isAIMode && !isDaemonRunning && !isPaused) {
            const timeSinceInteraction = Date.now() - lastInteractionTime;
            if (timeSinceInteraction < 5000) {
                setStatusMessage('Paused: Manual Control');
                return;
            }

            setStatusMessage('AI Monitoring Page...');
            interval = setInterval(() => {
                const lastTask = tasks[tasks.length - 1];
                if (lastTask && lastTask.status !== 'blocked_on_user' && lastTask.status !== 'completed' && lastTask.status !== 'failed') {
                    webViewRef.current?.scanDOM();
                }
            }, 5000);
        } else if (isPaused) {
            setStatusMessage('Paused');
        } else {
            setStatusMessage('Ready');
        }
        return () => { if (interval) clearInterval(interval); };
    }, [activePrompt, isAIMode, isDaemonRunning, tasks, isPaused, lastInteractionTime]);

    const addTask = (title: string, status: TaskStatus = 'pending', details?: string) => {
        const id = Date.now().toString() + Math.random().toString();
        setTasks(prev => [...prev, { id, title, status, timestamp: Date.now(), details }]);
        return id;
    };

    const updateTask = (id: string, status: TaskStatus, details?: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status, details: details || t.details } : t));
    };

    const handleExecutePrompt = (prompt: string) => {
        setActivePrompt(prompt);
        const t1 = addTask(`Execute: "${prompt}"`, 'in_progress');
        setWorkflowIds([t1]);
        setStatusMessage('AI Analyzing Page...');
        webViewRef.current?.scanDOM();
        if (prompt.toLowerCase().includes('swagbucks')) {
            setActiveUrl('https://www.swagbucks.com/p/login');
            setShowWebView(true);
        }
    };

    const handleDomMapReceived = async (map: any) => {
        if (!activePrompt) return;
        try {
            if (activePrompt.includes('Swagbucks: Survey Sweeper')) {
                // Simplified Swagbucks logic
                const bestSurvey = SurveyOrchestrator.evaluateDashboard(map);
                if (bestSurvey) {
                    webViewRef.current?.executeAction('click', bestSurvey.id);
                }
            } else {
                const decision = await determineNextAction(activePrompt, map);
                if (decision?.action === 'wait_for_user') {
                    setStatusMessage('Blocked: User Action Required');
                    if (workflowIds.length > 0) updateTask(workflowIds[workflowIds.length - 1], 'blocked_on_user', decision.reasoning);
                    setBlockedReason(decision.reasoning);
                    setIsBlockedModalVisible(true);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                } else if (decision?.action === 'done') {
                    setStatusMessage('Workflow Complete');
                    if (workflowIds.length > 0) updateTask(workflowIds[0], 'completed', decision.reasoning);
                    Alert.alert("Workflow Complete", decision.reasoning);
                    setActivePrompt('');
                    setWorkflowIds([]);
                } else if (decision?.targetId) {
                    // Update task with reasoning before executing
                    if (workflowIds.length > 0) {
                        updateTask(workflowIds[workflowIds.length - 1], 'in_progress', decision.reasoning);
                    }
                    webViewRef.current?.executeAction(decision.action as any, decision.targetId, decision.value);
                }
            }
        } catch (e) {
            console.error("LLM failure", e);
        }
    };

    const toggleDaemon = async () => {
        if (isDaemonRunning) await unregisterBackgroundFetchAsync();
        else await registerBackgroundFetchAsync();
        setIsDaemonRunning(!isDaemonRunning);
    };

    return {
        showWebView, isAIMode, setIsAIMode, useProxy, setUseProxy, isDaemonRunning,
        activeUrl, setActiveUrl, tabs, setTabs, activeTabId, setActiveTabId,
        tasks, isSettingsVisible, setIsSettingsVisible, isSidebarVisible, setIsSidebarVisible,
        isBlockedModalVisible, setIsBlockedModalVisible, blockedReason, statusMessage,
        webViewRef, handleExecutePrompt, handleDomMapReceived, toggleDaemon, isDesktop,
        isPaused, setIsPaused, trackManualInteraction
    };
};
