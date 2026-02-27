// Feature: Core | Trace: README.md
import { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { getEnvConfig } from '../../shared/env.utils';

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

    const config = getEnvConfig();
    const PROXY_BASE_URL = config.proxyBaseUrl;

    const trackManualInteraction = () => setLastInteractionTime(Date.now());

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
        trackManualInteraction
    };
};
