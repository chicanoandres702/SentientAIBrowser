// Feature: Core | Why: Browser UI state management — settings, modals, layout and user preferences
import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { getEnvConfig } from '../../shared/env.utils';
import { auth } from '../features/auth/firebase-config';
import { saveUserSetting, loadUserSettings } from '../features/settings/settings-firestore.service';

export type LayoutMode = 'standard' | 'focus' | 'split' | 'cockpit' | 'stack' | 'zen' | 'dashboard' | 'compact';

export const useBrowserState = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const userId = auth.currentUser?.uid;

    const [showWebView, setShowWebView] = useState(true);
    const [isAIMode, setIsAIModeRaw] = useState(true);
    const [useProxy, setUseProxyRaw] = useState(true);
    const [isDaemonRunning, setIsDaemonRunning] = useState(false);
    const [activePrompt, setActivePrompt] = useState('');
    const [isSidebarVisible, setIsSidebarVisible] = useState(isDesktop);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isIntelVisible, setIsIntelVisible] = useState(false);
    const [isBlockedModalVisible, setIsBlockedModalVisible] = useState(false);
    const [isInteractiveModalVisible, setIsInteractiveModalVisible] = useState(false);
    const [interactiveRequest, setInteractiveRequest] = useState<{ question: string, type: 'confirm' | 'input' } | null>(null);
    const [blockedReason, setBlockedReason] = useState('');
    const [statusMessage, setStatusMessage] = useState('Ready');
    const [isPaused, setIsPaused] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
    const [lastInteractionTime, setLastInteractionTime] = useState(0);
    const [sessionAnswerIds, setSessionAnswerIds] = useState<string[]>([]);
    const [lookedUpDocs, setLookedUpDocs] = useState<any[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isScholarMode, setIsScholarModeRaw] = useState(false);
    const [layoutMode, setLayoutModeRaw] = useState<LayoutMode>('standard');
    const [isRemoteMirrorEnabled, setIsRemoteMirrorEnabled] = useState(false);
    const [runtimeGeminiApiKeyState, setRuntimeGeminiApiKeyState] = useState('');
    const [useConfirmerAgent, setUseConfirmerAgentRaw] = useState(true);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const config = getEnvConfig();
    const PROXY_BASE_URL = config.proxyBaseUrl;

    // Load settings from Firestore on mount and when auth changes
    useEffect(() => {
        if (!userId) {
            setSettingsLoaded(true);
            return;
        }

        const loadSettings = async () => {
            const settings = await loadUserSettings(userId);
            if (settings.runtimeGeminiApiKey) setRuntimeGeminiApiKeyState(settings.runtimeGeminiApiKey);
            if (settings.useConfirmerAgent !== undefined) setUseConfirmerAgentRaw(settings.useConfirmerAgent);
            if (settings.isAIMode !== undefined) setIsAIModeRaw(settings.isAIMode);
            if (settings.useProxy !== undefined) setUseProxyRaw(settings.useProxy);
            if (settings.isScholarMode !== undefined) setIsScholarModeRaw(settings.isScholarMode);
            if (settings.layoutMode) setLayoutModeRaw(settings.layoutMode);
            setSettingsLoaded(true);
        };

        loadSettings();
    }, [userId]);

    const trackManualInteraction = () => setLastInteractionTime(Date.now());

    // Setters that persist to Firestore
    const setIsAIMode = (val: boolean) => {
        setIsAIModeRaw(val); if (userId) saveUserSetting(userId, 'isAIMode', val);
    };

    const setUseProxy = (val: boolean) => {
        setUseProxyRaw(val); if (userId) saveUserSetting(userId, 'useProxy', val);
    };

    const setIsScholarMode = (val: boolean) => {
        setIsScholarModeRaw(val);
        if (userId) saveUserSetting(userId, 'isScholarMode', val);
    };

    const setLayoutMode = (mode: LayoutMode) => {
        setLayoutModeRaw(mode);
        if (userId) saveUserSetting(userId, 'layoutMode', mode);
    };

    const setRuntimeGeminiApiKey = (key: string) => {
        const normalized = key.trim();
        setRuntimeGeminiApiKeyState(normalized);
        if (userId) saveUserSetting(userId, 'runtimeGeminiApiKey', normalized);
    };

    const setUseConfirmerAgent = (val: boolean) => {
        setUseConfirmerAgentRaw(val);
        if (userId) saveUserSetting(userId, 'useConfirmerAgent', val);
    };

    return {
        isDesktop, showWebView, setShowWebView, isAIMode, setIsAIMode,
        useProxy, setUseProxy, isDaemonRunning, setIsDaemonRunning,
        activePrompt, setActivePrompt, isSidebarVisible, setIsSidebarVisible,
        isSettingsVisible, setIsSettingsVisible, isIntelVisible, setIsIntelVisible,
        isBlockedModalVisible, setIsBlockedModalVisible, blockedReason, setBlockedReason,
        isInteractiveModalVisible, setIsInteractiveModalVisible, interactiveRequest, setInteractiveRequest,
        statusMessage, setStatusMessage, isPaused, setIsPaused,
        retryCount, setRetryCount, taskStartTime, setTaskStartTime,
        lastInteractionTime, setLastInteractionTime, PROXY_BASE_URL,
        lookedUpDocs, setLookedUpDocs, isScholarMode, setIsScholarMode,
        sessionAnswerIds, setSessionAnswerIds, isThinking, setIsThinking,
        layoutMode, setLayoutMode,
        isRemoteMirrorEnabled, setIsRemoteMirrorEnabled,
        runtimeGeminiApiKey: runtimeGeminiApiKeyState,
        setRuntimeGeminiApiKey,
        useConfirmerAgent, setUseConfirmerAgent,
        trackManualInteraction,
        settingsLoaded
    };
};
