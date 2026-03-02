// Feature: Layout | Trace: src/layouts/sections/LayoutSidebar.tsx
import React, { Suspense, lazy } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WorkflowSelector } from '../../components/WorkflowSelector';
import { uiColors } from '../../features/ui/theme/ui.theme';
import { sidebarStyles as ss } from '../styles/sidebar.styles';
import { styles as appStyles } from '../../../App.styles';
import { SidebarWidthMode } from '../config/layout.types';
import { LayoutMode } from '../../hooks/useBrowserState';

const TaskQueueUI = lazy(() => import('../../components/TaskQueueUI').then(m => ({ default: m.TaskQueueUI })));
const MobileTaskQueueUI = lazy(() => import('../../components/tasks/mobile/MobileTaskQueueUI').then(m => ({ default: m.MobileTaskQueueUI })));
const PromptInterface = lazy(() => import('@features/ui/components').then(m => ({ default: m.PromptInterface })));

export const SidebarContent: React.FC<{ s: any; theme: any }> = ({ s, theme }) => (
    <Suspense fallback={<ActivityIndicator color={uiColors(theme).accent} style={{ flex: 1, marginTop: 24 }} />}>
        <WorkflowSelector
            tabs={s.tabs}
            onSelectTab={s.selectTab}
            onCloseTab={s.closeTab}
            onNewTab={() => s.addNewTab('about:blank')}
            theme={theme}
        />
        <TaskQueueUI
            tasks={s.activeWorkflowId
                ? s.tasks.filter((t: any) => t.workflowId === s.activeWorkflowId || (!t.workflowId && t.tabId === s.activeTabId))
                : s.tasks}
            theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask}
            isPaused={s.isPaused} onPause={() => s.setIsPaused(true)} onResume={() => s.setIsPaused(false)}
            onActivateTask={(id: string) => s.updateTask(id, 'in_progress')}
            reorderMissions={s.reorderMissions} proxyBaseUrl={s.PROXY_BASE_URL}
            onCloseMission={s.closeMission} activeTabId={s.activeTabId} />
        <PromptInterface onExecutePrompt={s.handleExecutePrompt} theme={theme} />
    </Suspense>
);

/* ─── Desktop sidebar with accent strip ──────────────── */

interface SidebarProps {
    s: any;
    theme: any;
    placement?: 'left' | 'right';
    widthMode?: SidebarWidthMode;
    tintColor: string;
    layoutMode?: LayoutMode;
}

export const LayoutSidebar: React.FC<SidebarProps> = ({
    s,
    theme,
    placement = 'right',
    widthMode = 'standard',
    tintColor,
}) => {
    const colors = uiColors(theme);

    return (
        <View style={[
            ss.sidebar,
            placement === 'left' && ss.sidebarLeft,
            widthMode === 'compact' && ss.sidebarCompact,
            widthMode === 'focus' && ss.sidebarFocus,
            widthMode === 'split' && ss.sidebarSplit,
            widthMode === 'cockpit' && ss.sidebarCockpit,
            widthMode === 'dashboard' && ss.sidebarDashboard,
            { borderColor: colors.border },
        ]}>
            <View style={[
                ss.sidebarAccent,
                placement === 'left' ? ss.sidebarAccentLeft : ss.sidebarAccentRight,
                { backgroundColor: tintColor },
            ]} />
            <SidebarContent s={s} theme={theme} />
        </View>
    );
};

/* ─── Mobile sidebar overlay — uses mobile-optimised task layouts ─── */

export const MobileSidebar: React.FC<{ s: any; theme: any }> = ({ s, theme }) => {
    const colors = uiColors(theme);
    // Why: show tasks for the whole active workflow, not just the single active tab.
    // Falls back to all tasks if no workflowId is set (legacy tasks before this change).
    const filteredTasks = s.activeWorkflowId
        ? s.tasks.filter((t: any) => t.workflowId === s.activeWorkflowId || (!t.workflowId && t.tabId === s.activeTabId))
        : s.tasks;

    return (
        <View style={[appStyles.mobileSidebarOverlay, { backgroundColor: colors.bg }]}>
            <View style={ss.mobileSidebarHeader}>
                <Text style={[ss.mobileSidebarTitle, { color: colors.textMuted }]}>
                    COMMAND PANEL
                </Text>
                <TouchableOpacity
                    style={[ss.mobileSidebarClose, { borderColor: colors.border }]}
                    onPress={() => s.setIsSidebarVisible(false)}
                >
                    <Text style={{ color: colors.textDim, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
            </View>
            <Suspense fallback={<ActivityIndicator color={colors.accent} style={{ flex: 1, marginTop: 24 }} />}>
                <MobileTaskQueueUI
                    tasks={filteredTasks}
                    theme={theme}
                    addTask={s.addTask}
                    removeTask={s.removeTask}
                    clearTasks={s.clearTasks}
                    editTask={s.editTask}
                    showSwitcher={true}
                    activeTabId={s.activeTabId}
                />
            </Suspense>
        </View>
    );
};
