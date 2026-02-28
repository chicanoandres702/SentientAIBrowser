// Feature: Tasks | Why: "Command" mobile layout — full-screen task-first with bottom tabs
// Layout 1 of 3: The all-in-one command center — mission header + paged task views
import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { TaskItem } from '../../../features/tasks/types';
import { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { useHierarchicalTasks, useActiveMission, getTaskStats, SortMode, FilterType, HierarchyRow } from '../task-filter.utils';
import { MobileMissionHeader } from './MobileMissionHeader';
import { MobileTaskCard } from './MobileTaskCard';
import { MobileBottomTabs, MobileTaskPage } from './MobileBottomTabs';
import { MobileQuickActions } from './MobileQuickActions';
import { MobileTaskStats } from './MobileTaskStats';
import { TaskInput } from '../TaskInput';
import { TaskFilterBar } from '../TaskFilterBar';
import { m, MOBILE } from './mobile-task.styles';
import { commandStyles as cs } from './MobileCommandLayout.styles';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
}

/** Layout 1: COMMAND — Bottom tab navigation between Queue/Active/Stats/Prompt pages. */
export const MobileCommandLayout: React.FC<Props> = ({
    tasks, theme, addTask, removeTask, clearTasks, editTask,
}) => {
    const colors = uiColors(theme);
    const accent = colors.accent;
    const [page, setPage] = useState<MobileTaskPage>('queue');
    const [sortBy, setSortBy] = useState<SortMode>('time');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const listRef = useRef<FlatList>(null);

    const activeMission = useActiveMission(tasks);
    const stats = getTaskStats(tasks);
    const pageFilter: FilterType = page === 'active' ? 'active' : page === 'queue' ? filterType : 'all';
    const hierarchy = useHierarchicalTasks(tasks, pageFilter, sortBy);

    const scrollToActive = useCallback(() => {
        const idx = hierarchy.findIndex(r => r.type === 'task' && r.task.status === 'in_progress');
        if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
    }, [hierarchy]);

    const renderHierarchyRow = useCallback(({ item, index }: { item: HierarchyRow; index: number }) => {
        if (item.type === 'mission') {
            const progress = item.totalCount > 0 ? Math.round((item.completedCount / item.totalCount) * 100) : 0;
            return (
                <Animatable.View animation="fadeIn" duration={200} style={cs.missionSection}>
                    <View style={[cs.missionSectionDot, { backgroundColor: accent }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[cs.missionSectionTitle, { color: accent }]} numberOfLines={1}>{item.mission.title}</Text>
                        <View style={cs.missionSectionMeta}><View style={cs.missionSectionTrack}><View style={[cs.missionSectionFill, { width: `${progress}%`, backgroundColor: accent }]} /></View><Text style={[cs.missionSectionPct, { color: accent }]}>{item.completedCount}/{item.totalCount}</Text></View>
                    </View>
                </Animatable.View>
            );
        }
        return (
            <View style={cs.indentedCard}>
                <View style={cs.treeConnector}><View style={[cs.treeVert, !item.isLast && cs.treeVertFull, { backgroundColor: accent + '22' }]} /><View style={[cs.treeHoriz, { backgroundColor: accent + '22' }]} /></View>
                <View style={{ flex: 1 }}><MobileTaskCard item={item.task} accentColor={accent} removeTask={removeTask} editTask={editTask} index={index} /></View>
            </View>
        );
    }, [accent, removeTask, editTask]);

    return (
        <View style={m.screen}>
            <LinearGradient colors={[colors.panel, colors.panel2]} style={StyleSheet.absoluteFill} />
            <MobileMissionHeader mission={activeMission} totalTasks={stats.active + stats.completed + stats.failed} completedTasks={stats.completed} failedTasks={stats.failed} accentColor={accent} />
            {(page === 'queue' || page === 'active') && (
                <View style={{ flex: 1 }}>
                    {page === 'queue' && <TaskFilterBar filterType={filterType} setFilterType={setFilterType} sortBy={sortBy} setSortBy={setSortBy} stats={stats} accentColor={accent} />}
                    {page === 'active' && <View style={cs.pageLabel}><Text style={[m.caption, { color: accent }]}>⚡ ACTIVE TASKS</Text></View>}
                    <FlatList ref={listRef} data={hierarchy} keyExtractor={(row) => row.type === 'mission' ? `m-${row.mission.id}` : `t-${row.task.id}`} renderItem={renderHierarchyRow} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: MOBILE.fabSize + 24 }} windowSize={5} maxToRenderPerBatch={6} initialNumToRender={10} removeClippedSubviews={Platform.OS === 'android'} ListEmptyComponent={<View style={cs.empty}><Text style={{ fontSize: 28 }}>{page === 'active' ? '⚡' : '📋'}</Text><Text style={[m.h3, { color: accent + '88', marginTop: 8 }]}>{page === 'active' ? 'No active tasks' : 'Task queue is empty'}</Text></View>} />
                </View>
            )}
            {page === 'stats' && <MobileTaskStats tasks={tasks} accentColor={accent} />}
            {page === 'prompt' && (<View style={cs.promptPage}><View style={cs.promptHero}><Text style={{ fontSize: 32 }}>💬</Text><Text style={[m.h1, { color: accent, marginTop: 8 }]}>NEURAL PROMPT</Text><Text style={[m.label, { marginTop: 4, textAlign: 'center' }]}>Describe your mission and the AI will plan and execute it</Text></View><View style={cs.promptInputWrap}><TaskInput addTask={addTask} accentColor={accent} /></View></View>)}
            {(page === 'queue' || page === 'active') && <MobileQuickActions accentColor={accent} onClearAll={clearTasks} onScrollToActive={scrollToActive} onToggleSort={() => setSortBy(prev => prev === 'time' ? 'status' : 'time')} sortBy={sortBy} />}
            <MobileBottomTabs activePage={page} setActivePage={setPage} accentColor={accent} activeCount={stats.active} completedCount={stats.completed} />
        </View>
    );
};
