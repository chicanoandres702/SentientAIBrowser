// Feature: UI | Trace: README.md
import React, { Suspense, lazy, useCallback } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { HeadlessWebView } from '../components/HeadlessWebView';
import { BrowserTabs } from '../components/BrowserTabs';
import { BrowserChrome } from '../components/BrowserChrome';
import { SentientHeader } from '../components/SentientHeader';
import { SentientStatusBar } from '../components/SentientStatusBar';
import { BrowserPreview } from '../components/BrowserPreview';
import * as Animatable from 'react-native-animatable';
import { styles } from '../../App.styles';

const HazeOverlay = lazy(() => import('../components/HazeOverlay').then(m => ({ default: m.HazeOverlay })));
const SentientControlPanel = lazy(() => import('../components/SentientControlPanel').then(m => ({ default: m.SentientControlPanel })));
const TaskQueueUI = lazy(() => import('../components/TaskQueueUI').then(m => ({ default: m.TaskQueueUI })));
const PromptInterface = lazy(() => import('../components/PromptInterface').then(m => ({ default: m.PromptInterface })));
const NeuralMonologue = lazy(() => import('../features/llm/components/NeuralMonologue').then(m => ({ default: m.NeuralMonologue })));
const SettingsMenu = lazy(() => import('../components/SettingsMenu').then(m => ({ default: m.SettingsMenu })));
const BlockedUserModal = lazy(() => import('../components/BlockedUserModal').then(m => ({ default: m.BlockedUserModal })));
const SentinelInteractiveModal = lazy(() => import('../components/SentinelInteractiveModal').then(m => ({ default: m.SentinelInteractiveModal })));
const SentinelIntelModal = lazy(() => import('../components/SentinelIntelModal').then(m => ({ default: m.SentinelIntelModal })));

export const MainLayout = ({ s, theme, setTheme }: any) => {
    const handleReload = useCallback(() => {
        const url = s.activeUrl;
        s.setActiveUrl('');
        setTimeout(() => s.setActiveUrl(url), 10);
    }, [s.activeUrl, s.setActiveUrl]);

    const handleNewTab = useCallback(() => {
        s.addNewTab('https://www.google.com');
    }, [s.addNewTab]);

    const handleTogglePause = useCallback(() => {
        s.setIsPaused(!s.isPaused);
    }, [s.isPaused, s.setIsPaused]);

    const handleStop = useCallback(() => {
        s.setIsPaused(true);
        s.handleExecutePrompt('');
    }, [s.setIsPaused, s.handleExecutePrompt]);

    const handleCloseSidebar = useCallback(() => {
        s.setIsSidebarVisible(false);
    }, [s.setIsSidebarVisible]);

    const handleStartShouldSetResponder = useCallback(() => {
        s.trackManualInteraction();
        return false;
    }, [s.trackManualInteraction]);

    return (
        <SafeAreaView style={styles.container}>
            <SentientHeader isAIMode={s.isAIMode} isSidebarVisible={s.isSidebarVisible} setIsSidebarVisible={s.setIsSidebarVisible} setIsSettingsVisible={s.setIsSettingsVisible} theme={theme} />
            <BrowserTabs tabs={s.tabs} onSelectTab={s.selectTab} onCloseTab={s.closeTab} onNewTab={handleNewTab} theme={theme} />
            <BrowserChrome url={s.activeUrl} onNavigate={s.setActiveUrl} onReload={handleReload} theme={theme} />
            <View style={styles.mainLayout}>
                <View style={styles.contentArea}>
                    <View style={styles.webViewWrapper} onStartShouldSetResponder={handleStartShouldSetResponder}>
                        <BrowserPreview tabId={s.activeTabId} theme={theme} />
                        {s.isAIMode && !s.isPaused && <Animatable.View animation="fadeIn" iterationCount="infinite" direction="alternate" duration={2500} style={styles.hazeLayer} pointerEvents="none"><Suspense fallback={null}><HazeOverlay theme={theme} /></Suspense></Animatable.View>}
                    </View>
                    {s.isAIMode && <Suspense fallback={null}><SentientControlPanel isPaused={s.isPaused} onTogglePause={handleTogglePause} onStop={handleStop} onNext={() => {}} onPrev={() => {}} theme={theme} /></Suspense>}
                    {!s.isDesktop && s.isAIMode && s.isSidebarVisible && <View style={styles.mobileSidebarOverlay}><Suspense fallback={<ActivityIndicator color="#ff003c" style={{ flex: 1 }} />}><TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} /><PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} /></Suspense><TouchableOpacity style={styles.closeSidebarButton} onPress={handleCloseSidebar}><Text style={{ color: '#fff' }}>Close Assistant</Text></TouchableOpacity></View>}
                </View>
                {s.isDesktop && s.isAIMode && s.isSidebarVisible && <View style={styles.sidebar}><Suspense fallback={<ActivityIndicator color="#ff003c" style={{ flex: 1, marginTop: 20 }} />}><TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} /><PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} /></Suspense></View>}
                {s.isAIMode && <Suspense fallback={null}><NeuralMonologue /></Suspense>}
            </View>
            <SentientStatusBar isAIMode={s.isAIMode} statusMessage={s.statusMessage} useProxy={s.useProxy} theme={theme} isScholarMode={s.isScholarMode} />
            <Modals s={s} theme={theme} setTheme={setTheme} />
        </SafeAreaView>
    );
};

const Modals = ({ s, theme, setTheme }: any) => (
    <Suspense fallback={null}>
        <SettingsMenu visible={s.isSettingsVisible} onClose={() => s.setIsSettingsVisible(false)} theme={theme} setTheme={setTheme} isAIMode={s.isAIMode} setIsAIMode={s.setIsAIMode} useProxy={s.useProxy} setUseProxy={s.setUseProxy} isScholarMode={s.isScholarMode} setIsScholarMode={s.setIsScholarMode} isDaemonRunning={s.isDaemonRunning} onToggleDaemon={s.toggleDaemon} github={{ token: s.githubToken, setToken: s.setGithubToken, owner: s.repoOwner, setOwner: s.setRepoOwner, repo: s.repoName, setRepo: s.setRepoName }} />
        <SentinelInteractiveModal visible={s.isInteractiveModalVisible} question={s.interactiveRequest?.question || ''} requestType={s.interactiveRequest?.type || 'confirm'} theme={theme} onResponse={() => { }} />
        <SentinelIntelModal visible={s.isIntelVisible} onClose={() => s.setIsIntelVisible(false)} theme={theme} earningsData={s.earningsData} domain={s.currentDomain} />
        <BlockedUserModal visible={s.isBlockedModalVisible} reason={s.blockedReason} theme={theme} onClose={() => s.setIsBlockedModalVisible(false)} />
    </Suspense>
);
