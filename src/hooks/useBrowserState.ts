// Feature: Core | Trace: README.md
import { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { getEnvConfig } from '../../shared/env.utils';

export type LayoutMode = 'standard' | 'focus' | 'split' | 'cockpit' | 'stack' | 'zen' | 'dashboard' | 'compact';

export const useBrowserState = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [showWebView, setShowWebView] = useState(true);
    const [isAIMode, setIsAIMode] = useState(true);
    const [useProxy, setUseProxy] = useState(true);
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
    const [isScholarMode, setIsScholarMode] = useState(false);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('standard');
    const [isRemoteMirrorEnabled, setIsRemoteMirrorEnabled] = useState(false);
    const [runtimeGeminiApiKeyState, setRuntimeGeminiApiKeyState] = useState(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return '';
        return window.localStorage.getItem('sentient.runtimeGeminiApiKey') || '';
    });

    const config = getEnvConfig();
    const PROXY_BASE_URL = config.proxyBaseUrl;

    const trackManualInteraction = () => setLastInteractionTime(Date.now());
    const setRuntimeGeminiApiKey = (key: string) => {
        const normalized = key.trim();
        setRuntimeGeminiApiKeyState(normalized);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            if (normalized) window.localStorage.setItem('sentient.runtimeGeminiApiKey', normalized);
            else window.localStorage.removeItem('sentient.runtimeGeminiApiKey');
        }
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
        trackManualInteraction
    };
};
