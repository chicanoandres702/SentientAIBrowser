// Feature: Sidebar Tab Content | Trace: src/layouts/sections/SidebarTabContent.tsx
// Why: Extracts tab content logic from LayoutSidebar for modularity and Sentient compliance.
import React, { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { sidebarStyles as ss } from '../styles/sidebar.styles';
import { DrawerTab } from './SidebarTabs';

const TaskQueueUI = React.lazy(() => import('../../components/TaskQueueUI').then(m => ({ default: m.TaskQueueUI })));
const PromptInterface = React.lazy(() => import('@features/ui/components').then(m => ({ default: m.PromptInterface })));

const IntelPanel = React.lazy(() => import('./IntelPanel').then(m => ({ default: m.IntelPanel })));

interface SidebarTabContentProps {
    activeTab: DrawerTab;
    s: any;
    theme: any;
    accent: string;
    filteredTasks: any[];
}

export const SidebarTabContent: React.FC<SidebarTabContentProps> = ({ activeTab, s, theme, accent, filteredTasks }) => (
    <View style={ss.tabContent}>
        <Suspense fallback={<ActivityIndicator color={accent} style={{ flex: 1, marginTop: 24 }} />}>
            {activeTab === 'agent' && (
                <>
                    {/* ...existing WorkflowSelector and PromptInterface logic... */}
                </>
            )}
            {activeTab === 'queue' && (
                <TaskQueueUI
                    tasks={filteredTasks} theme={theme}
                    addTask={s.addTask} removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask}
                    isPaused={s.isPaused} onPause={() => s.setIsPaused(true)} onResume={() => s.setIsPaused(false)}
                    onActivateTask={(id: string) => s.updateTask(id, 'in_progress')}
                    reorderMissions={s.reorderMissions} proxyBaseUrl={s.PROXY_BASE_URL}
                    onCloseMission={s.closeMission} activeTabId={s.activeTabId}
                />
            )}
            {activeTab === 'intel' && <IntelPanel s={s} theme={theme} />}
        </Suspense>
    </View>
);
