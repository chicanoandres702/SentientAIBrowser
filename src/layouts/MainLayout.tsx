// Feature: UI | Trace: README.md
import React, { Suspense, lazy, useCallback } from 'react';
import { View, SafeAreaView, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BrowserTabs } from '../components/BrowserTabs';
import { BrowserChrome } from '../components/BrowserChrome';
import { BrowserPreview } from '../components/BrowserPreview';
import * as Animatable from 'react-native-animatable';
import { styles } from '../../App.styles';

const SentientHeader = lazy(() => import('../components/SentientHeader').then(m => ({ default: m.SentientHeader })));
const SentientStatusBar = lazy(() => import('../components/SentientStatusBar').then(m => ({ default: m.SentientStatusBar })));
const MissionOverview = lazy(() => import('../features/missions/components/MissionOverview').then(m => ({ default: m.MissionOverview })));
const HazeOverlay = lazy(() => import('../components/HazeOverlay').then(m => ({ default: m.HazeOverlay })));
const SentientControlPanel = lazy(() => import('../components/SentientControlPanel').then(m => ({ default: m.SentientControlPanel })));
const TaskQueueUI = lazy(() => import('../components/TaskQueueUI').then(m => ({ default: m.TaskQueueUI })));
const PromptInterface = lazy(() => import('../components/PromptInterface').then(m => ({ default: m.PromptInterface })));
const NeuralMonologue = lazy(() => import('../features/llm/components/NeuralMonologue/NeuralMonologue').then(m => ({ default: m.NeuralMonologue })));
const MainModals = lazy(() => import('../components/MainModals').then(m => ({ default: m.MainModals })));

export const MainLayout = ({ s, theme, setTheme }: any) => {
    const [isMissionOverviewVisible, setIsMissionOverviewVisible] = React.useState(false);
    return (
        <SafeAreaView style={styles.container}>
            <Suspense fallback={null}>
                <SentientHeader isAIMode={s.isAIMode} isSidebarVisible={s.isSidebarVisible} 
                    setIsSidebarVisible={s.setIsSidebarVisible} setIsSettingsVisible={s.setIsSettingsVisible} 
                    onShowOverview={() => setIsMissionOverviewVisible(true)} theme={theme} />
            </Suspense>
            <BrowserTabs tabs={s.tabs} onSelectTab={s.selectTab} onCloseTab={s.closeTab} onNewTab={() => s.addNewTab('https://www.google.com')} theme={theme} />
            <BrowserChrome url={s.activeUrl} onNavigate={s.setActiveUrl} onReload={s.handleReload} theme={theme} />
            <MainContent s={s} theme={theme} />
            <Suspense fallback={null}>
                <SentientStatusBar isAIMode={s.isAIMode} statusMessage={s.statusMessage} useProxy={s.useProxy} theme={theme} isScholarMode={s.isScholarMode} />
            </Suspense>
            <Suspense fallback={null}><MainModals s={s} theme={theme} setTheme={setTheme} /></Suspense>
            {isMissionOverviewVisible && <MissionOverviewWrapper s={s} theme={theme} onClose={() => setIsMissionOverviewVisible(false)} />}
        </SafeAreaView>
    );
};

const MainContent = ({ s, theme }: any) => (
    <View style={styles.mainLayout}>
        <View style={styles.contentArea}>
            <View style={styles.webViewWrapper} onStartShouldSetResponder={() => { s.trackManualInteraction(); return false; }}>
                <BrowserPreview tabId={s.activeTabId} theme={theme} />
                {s.isAIMode && !s.isPaused && <Animatable.View animation="fadeIn" iterationCount="infinite" direction="alternate" duration={2500} style={[styles.hazeLayer, { pointerEvents: 'none' }]}><Suspense fallback={null}><HazeOverlay theme={theme} /></Suspense></Animatable.View>}
            </View>
            {s.isAIMode && <Suspense fallback={null}><SentientControlPanel isPaused={s.isPaused} onTogglePause={() => s.setIsPaused(!s.isPaused)} onStop={() => { s.setIsPaused(true); s.handleExecutePrompt(''); }} onNext={() => {}} onPrev={() => {}} theme={theme} /></Suspense>}
            {!s.isDesktop && s.isAIMode && s.isSidebarVisible && <MobileSidebar s={s} theme={theme} />}
        </View>
        {s.isDesktop && s.isAIMode && s.isSidebarVisible && <Sidebar s={s} theme={theme} />}
        {s.isAIMode && <Suspense fallback={null}><NeuralMonologue /></Suspense>}
    </View>
);

const MobileSidebar = ({ s, theme }: any) => (
    <View style={styles.mobileSidebarOverlay}>
        <Suspense fallback={<ActivityIndicator color="#ff003c" style={{ flex: 1 }} />}>
            <TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} />
            <PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} />
        </Suspense>
        <TouchableOpacity style={styles.closeSidebarButton} onPress={() => s.setIsSidebarVisible(false)}>
            <Text style={{ color: '#fff' }}>Close </Text>
        </TouchableOpacity>
    </View>
);

const Sidebar = ({ s, theme }: any) => (
    <View style={styles.sidebar}>
        <Suspense fallback={<ActivityIndicator color="#ff003c" style={{ flex: 1, marginTop: 20 }} />}>
            <TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} />
            <PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} />
        </Suspense>
    </View>
);

const MissionOverviewWrapper = ({ s, theme, onClose }: any) => (
    <View style={StyleSheet.absoluteFill}>
        <Suspense fallback={<ActivityIndicator color="#ff003c" />}>
            <MissionOverview theme={theme} onSelectMission={(id: any) => s.selectTab(id)} 
                onLaunchRoutine={(url: any, goal: any) => { s.setActiveUrl(url); s.handleExecutePrompt(goal); }}
                onClose={onClose} currentGoal={s.activePrompt} currentUrl={s.activeUrl} />
        </Suspense>
    </View>
);
