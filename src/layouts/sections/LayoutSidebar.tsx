// Feature: Layout | Trace: src/layouts/sections/LayoutSidebar.tsx
/*
 * [Parent Feature/Milestone] Control Panel UI — Tabbed Command Drawer
 * [Child Task/Issue] Sidebar redesign: 3 tabs AGENT | QUEUE | INTEL
 * [Subtask] Tab bar + lazy content, intel inline stats panel
 * [Upstream] useSentientBrowser → [Downstream] RowLayout, DashboardLayout, StackLayout
 * [Law Check] 99 lines | Passed 100-Line Law
 */
import React, { Suspense, lazy, useState } from 'react';
import { View } from 'react-native';
import { SidebarTabs, DrawerTab } from './SidebarTabs';
import { SidebarTabContent } from './SidebarTabContent';
import { uiColors } from '../../features/ui/theme/ui.theme';
import { sidebarStyles as ss } from '../styles/sidebar.styles';
import { styles as appStyles } from '../../../App.styles';
import { SidebarWidthMode } from '../config/layout.types';
import { LayoutMode } from '../../hooks/useBrowserState';
import { BASE } from '../../features/ui/theme/ui.primitives';

const TaskQueueUI = lazy(() => import('../../components/TaskQueueUI').then(m => ({ default: m.TaskQueueUI })));
const MobileTaskQueueUI = lazy(() => import('../../components/tasks/mobile/MobileTaskQueueUI').then(m => ({ default: m.MobileTaskQueueUI })));
const PromptInterface = lazy(() => import('@features/ui/components').then(m => ({ default: m.PromptInterface })));

type DrawerTab = 'agent' | 'queue' | 'intel';



export const SidebarContent: React.FC<{ s: any; theme: any }> = ({ s, theme }) => {
    const [activeTab, setActiveTab] = useState<DrawerTab>('queue');
    const colors = uiColors(theme);
    const accent = colors.accent;
    const filteredTasks = s.activeWorkflowId
        ? s.tasks.filter((t: any) => t.workflowId === s.activeWorkflowId || (!t.workflowId && t.tabId === s.activeTabId))
        : s.tasks;

    return (
        <View style={{ flex: 1 }}>
            <SidebarTabs activeTab={activeTab} setActiveTab={setActiveTab} accent={accent} />
            <SidebarTabContent activeTab={activeTab} s={s} theme={theme} accent={accent} filteredTasks={filteredTasks} />
        </View>
    );
};

/* ─── Desktop sidebar with accent strip + tab drawer ─── */
interface SidebarProps {
    s: any; theme: any;
    placement?: 'left' | 'right';
    widthMode?: SidebarWidthMode;
    tintColor: string;
    layoutMode?: LayoutMode;
}

export const LayoutSidebar: React.FC<SidebarProps> = ({ s, theme, placement = 'right', widthMode = 'standard', tintColor }) => {
    const colors = uiColors(theme);
    return (
        <View style={[ss.sidebar, placement === 'left' && ss.sidebarLeft, widthMode === 'compact' && ss.sidebarCompact, widthMode === 'focus' && ss.sidebarFocus, widthMode === 'split' && ss.sidebarSplit, widthMode === 'cockpit' && ss.sidebarCockpit, widthMode === 'dashboard' && ss.sidebarDashboard, { borderColor: colors.border }]}>
            <View style={[ss.sidebarAccent, placement === 'left' ? ss.sidebarAccentLeft : ss.sidebarAccentRight, { backgroundColor: tintColor }]} />
            <SidebarContent s={s} theme={theme} />
        </View>
    );
};

/* ─── Mobile sidebar overlay ─── */
export const MobileSidebar: React.FC<{ s: any; theme: any }> = ({ s, theme }) => {
    const colors = uiColors(theme);
    const filteredTasks = s.activeWorkflowId ? s.tasks.filter((t: any) => t.workflowId === s.activeWorkflowId || (!t.workflowId && t.tabId === s.activeTabId)) : s.tasks;
    return (
        <View style={[appStyles.mobileSidebarOverlay, { backgroundColor: colors.bg }]}>
            <View style={ss.mobileSidebarHeader}>
                <Text style={[ss.mobileSidebarTitle, { color: colors.textMuted }]}>COMMAND PANEL</Text>
                <TouchableOpacity style={[ss.mobileSidebarClose, { borderColor: colors.border }]} onPress={() => s.setIsSidebarVisible(false)}>
                    <Text style={{ color: colors.textDim, fontSize: 15 }}>✕</Text>
                </TouchableOpacity>
            </View>
            <Suspense fallback={<ActivityIndicator color={colors.accent} style={{ flex: 1, marginTop: 24 }} />}>
                <MobileTaskQueueUI tasks={filteredTasks} theme={theme} addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask} showSwitcher activeTabId={s.activeTabId} />
            </Suspense>
        </View>
    );
};
