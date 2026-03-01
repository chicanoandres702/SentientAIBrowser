// Feature: Layout | Why: Dashboard arrangement isolated for single-responsibility
import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { layoutSectionStyles as ls } from '../styles/layout-container.styles';
import { dashboardStyles as ds } from '../styles/dashboard.styles';
import { PreviewStage } from './PreviewStage';
import { LayoutSidebar } from './LayoutSidebar';
import { DashboardPanel } from './DashboardPanel';
import { Monologue } from './Monologue';
import { UiColors } from '../../features/ui/theme/ui.theme';

const TaskQueueUI = lazy(() =>
    import('../../components/TaskQueueUI').then(m => ({ default: m.TaskQueueUI })),
);

interface Props {
    s: any;
    theme: any;
    config: any;
    responderProps: Record<string, unknown>;
    colors: UiColors;
    showSidebar: boolean;
}

/** Dashboard mode: preview left, tasks below, sidebar right */
export const DashboardLayout: React.FC<Props> = ({
    s, theme, config, responderProps, colors, showSidebar,
}) => (
    <View style={ls.mainRow}>
        <View style={ds.dashboardLeft}>
            <PreviewStage s={s} theme={theme} responderProps={responderProps} hideControlPanel />
            <View style={[ds.dashboardInfoBar, { borderTopColor: colors.border }]}>
                <DashboardPanel title="TASKS" accent={colors.accent}>
                    <Suspense fallback={<ActivityIndicator size="small" color={colors.accent} />}>
                        <TaskQueueUI tasks={s.tasks} theme={theme} addTask={s.addTask}
                            removeTask={s.removeTask} clearTasks={s.clearTasks} editTask={s.editTask}
                            isPaused={s.isPaused} onPause={() => s.setIsPaused(true)} onResume={() => s.setIsPaused(false)}
                            onActivateTask={(id) => s.updateTask(id, 'in_progress')}
                            reorderMissions={s.reorderMissions} proxyBaseUrl={s.PROXY_BASE_URL} />
                    </Suspense>
                </DashboardPanel>
            </View>
        </View>
        {showSidebar && (
            <LayoutSidebar s={s} theme={theme} placement="right"
                widthMode="dashboard" tintColor={colors.accent} />
        )}
        <Monologue config={config} isAIMode={s.isAIMode} />
    </View>
);
