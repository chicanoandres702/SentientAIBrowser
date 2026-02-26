// Feature: UI | Trace: README.md
import React, { Suspense, lazy, useCallback } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { HeadlessWebView } from '../components/HeadlessWebView';
import { BrowserTabs } from '../components/BrowserTabs';
import { BrowserChrome } from '../components/BrowserChrome';
import { TabGroupsOverview } from '../components/TabGroupsOverview';
import { SentientHeader } from '../components/SentientHeader';
import { SentientStatusBar } from '../components/SentientStatusBar';
import * as Animatable from 'react-native-animatable';
import { styles } from '../../App.styles';

const HazeOverlay = lazy(() => import('../components/HazeOverlay').then(m => ({ default: m.HazeOverlay })));
const SentientControlPanel = lazy(() => import('../components/SentientControlPanel').then(m => ({ default: m.SentientControlPanel })));
import { TaskQueueUI } from '../components/TaskQueueUI';
import { PromptInterface } from '../components/PromptInterface';
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

    const activeGroup = s.groups.find((g: any) => g.id === s.activeGroupId) || s.groups[0];

    return (
        <SafeAreaView style={styles.container}>
            <SentientHeader isAIMode={s.isAIMode} isSidebarVisible={s.isSidebarVisible} setIsSidebarVisible={s.setIsSidebarVisible} setIsSettingsVisible={s.setIsSettingsVisible} setIsIntelVisible={s.setIsIntelVisible} theme={theme} domain={s.currentDomain} />
            <BrowserTabs tabs={activeGroup?.tabs || []} onSelectTab={s.selectTab} onCloseTab={s.closeTab} onNewTab={handleNewTab} onOpenOverview={() => s.setIsOverviewMode(true)} theme={theme} />
            <BrowserChrome url={s.activeUrl} onNavigate={s.setActiveUrl} onReload={handleReload} theme={theme} />
            <View style={styles.mainLayout}>
                {s.isOverviewMode && (
                    <TabGroupsOverview
                        groups={s.groups}
                        activeGroupId={s.activeGroupId}
                        onSelectGroup={s.selectGroup}
                        onNewGroup={s.addNewGroup}
                        onCloseOverview={() => s.setIsOverviewMode(false)}
                        theme={theme}
                    />
                )}
                <Animatable.View 
                    transition={['scale', 'opacity']}
                    duration={300}
                    style={[styles.contentArea, s.isOverviewMode && { transform: [{ scale: 0.8 }], opacity: 0.5 }, { pointerEvents: s.isOverviewMode ? 'none' : 'auto' as any }]}
                >
                    <View style={styles.webViewWrapper} onStartShouldSetResponder={handleStartShouldSetResponder}>
                        {s.groups.flatMap((group: any) => 
                            group.tabs.map((tab: any) => (
                                <HeadlessWebView 
                                    key={tab.id}
                                    ref={(el) => { if (el) s.webViewRefs.current[tab.id] = el; }} 
                                    isVisible={s.showWebView && tab.id === s.activeTabId && group.id === s.activeGroupId} 
                                    url={tab.url} 
                                    tabId={tab.id}
                                    useProxy={s.useProxy} 
                                    onDomMapReceived={(map) => s.handleDomMapReceived(map, tab.id)} 
                                    onNewTabRequested={s.addNewTab} 
                                />
                            ))
                        )}
                    </View>
                    {s.isAIMode && <Suspense fallback={null}><SentientControlPanel isPaused={s.isPaused} onTogglePause={handleTogglePause} onStop={handleStop} onNext={() => { }} onPrev={() => { }} theme={theme} /></Suspense>}
                    {!s.isDesktop && s.isAIMode && s.isSidebarVisible && <View style={styles.mobileSidebarOverlay}><TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} /><PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} /><TouchableOpacity style={styles.closeSidebarButton} onPress={handleCloseSidebar}><Text style={{ color: '#fff' }}>Close Assistant</Text></TouchableOpacity></View>}
                    {/* Haze at contentArea level: scoped away from the sidebar */}
                    {s.isAIMode && !s.isPaused && <Animatable.View animation="fadeIn" duration={2500} style={styles.hazeLayer}><Suspense fallback={null}><HazeOverlay theme={theme} /></Suspense></Animatable.View>}
                </Animatable.View>
                {s.isDesktop && s.isAIMode && s.isSidebarVisible && <View style={styles.sidebar}><TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} /><PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} /></View>}
                {s.isAIMode && <Suspense fallback={null}><NeuralMonologue /></Suspense>}
            </View>
            <SentientStatusBar isAIMode={s.isAIMode} statusMessage={s.statusMessage} useProxy={s.useProxy} theme={theme} isScholarMode={s.isScholarMode} />
            <Modals s={s} theme={theme} setTheme={setTheme} />
        </SafeAreaView>
    );
};

const Modals = ({ s, theme, setTheme }: any) => (
    <Suspense fallback={null}>
        <SettingsMenu visible={s.isSettingsVisible} onClose={() => s.setIsSettingsVisible(false)} theme={theme} setTheme={setTheme} isAIMode={s.isAIMode} setIsAIMode={s.setIsAIMode} useProxy={s.useProxy} setUseProxy={s.setUseProxy} isScholarMode={s.isScholarMode} setIsScholarMode={s.setIsScholarMode} isDaemonRunning={s.isDaemonRunning} onToggleDaemon={s.toggleDaemon} github={{ token: s.githubToken, setToken: s.setGithubToken, owner: s.repoOwner, setOwner: s.setRepoOwner, repo: s.repoName, setRepo: s.setRepoName }} geminiApiKey={s.geminiApiKey} setGeminiApiKey={s.setGeminiApiKey} />
        <SentinelInteractiveModal visible={s.isInteractiveModalVisible} question={s.interactiveRequest?.question || ''} requestType={s.interactiveRequest?.type || 'confirm'} theme={theme} onResponse={(confirmed) => { s.onInteractiveResponse?.(confirmed); s.setIsInteractiveModalVisible(false); s.setOnInteractiveResponse(null); }} />
        <SentinelIntelModal visible={s.isIntelVisible} onClose={() => s.setIsIntelVisible(false)} theme={theme} earningsData={s.earningsData} domain={s.currentDomain} />
        <BlockedUserModal visible={s.isBlockedModalVisible} reason={s.blockedReason} theme={theme} onClose={() => s.setIsBlockedModalVisible(false)} />
    </Suspense>
);
