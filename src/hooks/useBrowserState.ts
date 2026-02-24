import { useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

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
    const [blockedReason, setBlockedReason] = useState('');
    const [statusMessage, setStatusMessage] = useState('Ready');
    const [isPaused, setIsPaused] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
    const [lastInteractionTime, setLastInteractionTime] = useState(0);
    const [sessionAnswerIds, setSessionAnswerIds] = useState<string[]>([]);
    const [githubToken, setGithubToken] = useState<string>('');
    const [repoOwner, setRepoOwner] = useState<string>('');
    const [repoName, setRepoName] = useState<string>('');
    const [lookedUpDocs, setLookedUpDocs] = useState<any[]>([]);
    const [isScholarMode, setIsScholarMode] = useState(false);

    const PROXY_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

    return {
        isDesktop, showWebView, setShowWebView, isAIMode, setIsAIMode,
        useProxy, setUseProxy, isDaemonRunning, setIsDaemonRunning,
        activePrompt, setActivePrompt, isSidebarVisible, setIsSidebarVisible,
        isSettingsVisible, setIsSettingsVisible, isIntelVisible, setIsIntelVisible,
        isBlockedModalVisible, setIsBlockedModalVisible, blockedReason, setBlockedReason,
        statusMessage, setStatusMessage, isPaused, setIsPaused,
        retryCount, setRetryCount, taskStartTime, setTaskStartTime,
        lastInteractionTime, setLastInteractionTime, PROXY_BASE_URL,
        githubToken, setGithubToken, repoOwner, setRepoOwner, repoName, setRepoName,
        lookedUpDocs, setLookedUpDocs, isScholarMode, setIsScholarMode
    };
};
