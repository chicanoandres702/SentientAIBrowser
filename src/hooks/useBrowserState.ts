// Feature: Core | Trace: README.md
import { useState, useCallback } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

export const useBrowserState = () => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const [showWebView, setShowWebView] = useState(true);
    const [isAIMode, setIsAIMode] = useState(true);
    const [useProxy, setUseProxy] = useState(true);
    const [isDaemonRunning, setIsDaemonRunning] = useState(false);
    const [isOverviewMode, setIsOverviewMode] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(isDesktop);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [isIntelVisible, setIsIntelVisible] = useState(false);
    const [isBlockedModalVisible, setIsBlockedModalVisible] = useState(false);
    const [blockedReason, setBlockedReason] = useState('');
    const [lastInteractionTime, setLastInteractionTime] = useState(0);
    const [sessionAnswerIds, setSessionAnswerIds] = useState<string[]>([]);
    // Sentinel Intel Modal
    const [earningsData, setEarningsData] = useState<any[]>([]);
    const [currentDomain, setCurrentDomain] = useState<string>('');
    // Sentinel Interactive Modal
    const [isInteractiveModalVisible, setIsInteractiveModalVisible] = useState(false);
    const [interactiveRequest, setInteractiveRequest] = useState<{ question: string; type: string } | null>(null);
    // Why: one-shot callback injected by useDomDecision, cleared after use
    const [onInteractiveResponse, setOnInteractiveResponse] = useState<((confirmed: boolean) => void) | null>(null);

    const trackManualInteraction = useCallback(() => {
        setLastInteractionTime(Date.now());
    }, []);
    const [githubToken, setGithubToken] = useState<string>('');
    const [repoOwner, setRepoOwner] = useState<string>('');
    const [repoName, setRepoName] = useState<string>('');
    const [lookedUpDocs, setLookedUpDocs] = useState<any[]>([]);
    const [isScholarMode, setIsScholarMode] = useState(false);
    const [geminiApiKey, setGeminiApiKey] = useState<string>('');

    const PROXY_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

    return {
        isDesktop, showWebView, setShowWebView, isAIMode, setIsAIMode,
        useProxy, setUseProxy, isDaemonRunning, setIsDaemonRunning,
        isOverviewMode, setIsOverviewMode, isSidebarVisible, setIsSidebarVisible,
        isSettingsVisible, setIsSettingsVisible, isIntelVisible, setIsIntelVisible,
        isBlockedModalVisible, setIsBlockedModalVisible, blockedReason, setBlockedReason,
        lastInteractionTime, setLastInteractionTime, sessionAnswerIds, setSessionAnswerIds, PROXY_BASE_URL,
        githubToken, setGithubToken, repoOwner, setRepoOwner, repoName, setRepoName,
        lookedUpDocs, setLookedUpDocs, isScholarMode, setIsScholarMode,
        geminiApiKey, setGeminiApiKey,
        earningsData, setEarningsData, currentDomain, setCurrentDomain,
        isInteractiveModalVisible, setIsInteractiveModalVisible,
        interactiveRequest, setInteractiveRequest, trackManualInteraction,
        onInteractiveResponse, setOnInteractiveResponse
    };
};
