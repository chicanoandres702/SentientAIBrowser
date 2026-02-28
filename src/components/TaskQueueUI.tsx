// Feature: Tasks | Why: Hierarchical mission→task rendering with fullscreen toggle
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItemView } from './tasks/TaskItemView';
import { TaskInput } from './tasks/TaskInput';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { TaskProgressBar } from './tasks/TaskProgressBar';
import { styles, missionStyles } from './tasks/TaskQueueUI.styles';
import { uiColors, BASE } from '../features/ui/theme/ui.theme';
import { FilterType, SortMode, getTaskStats, useHierarchicalTasks, HierarchyRow } from './tasks/task-filter.utils';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
}

/** Fullscreen overlay styles — absolute positioning covers entire viewport */
const fsStyles = StyleSheet.create({
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999, backgroundColor: BASE.bg,
    },
    toggleBtn: {
        borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, marginRight: 8,
    },
    toggleText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.6 },
});

export const TaskQueueUI: React.FC<Props> = React.memo(({
    tasks, theme, addTask, removeTask, clearTasks, editTask,
}) => {
    const colors = uiColors(theme);
    const accentColor = colors.accent;
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortMode>('time');
    const [isFullscreen, setIsFullscreen] = useState(false);

    const hierarchyRows = useHierarchicalTasks(tasks, filterType, sortBy);
    const stats = getTaskStats(tasks);

    const renderRow = useCallback(
        ({ item }: { item: HierarchyRow }) => {
            if (item.type === 'mission') {
                const m = item.mission;
                return (
                    <View style={[missionStyles.card, { borderColor: accentColor + '44' }]}>
                        <Text style={[missionStyles.label, { color: accentColor }]}>📋 MISSION</Text>
                        <Text style={missionStyles.title} numberOfLines={2}>{m.title.toUpperCase()}</Text>
                        <View style={missionStyles.progressRow}>
                            <View style={missionStyles.track}>
                                <View style={[missionStyles.bar, { width: `${m.progress || 0}%`, backgroundColor: accentColor }]} />
                            </View>
                            <Text style={[missionStyles.pct, { color: accentColor }]}>{m.progress || 0}%</Text>
                        </View>
                        <Text style={missionStyles.details}>{item.completedCount}/{item.totalCount} tasks done{m.details ? ` · ${m.details}` : ''}</Text>
                    </View>
                );
            }
            return <TaskItemView item={item.task} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />;
        },
        [accentColor, removeTask, editTask],
    );

    const content = (
        <View style={[styles.container, isFullscreen && { flex: 1 }]}>
            <LinearGradient colors={[colors.panel, colors.panel2]} style={styles.absoluteGradient} />

            <View style={styles.headerRow}>
                <View>
                    <Text style={[styles.header, { color: accentColor }]}>AGENT INTEL</Text>
                    <Text style={styles.subHeader}>NEURAL SYNC ACTIVE</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setIsFullscreen(!isFullscreen)}
                        style={[fsStyles.toggleBtn, { borderColor: accentColor + '66' }]}
                    >
                        <Text style={[fsStyles.toggleText, { color: accentColor }]}>
                            {isFullscreen ? '⊟ MINIMIZE' : '⊞ FULLSCREEN'}
                        </Text>
                    </TouchableOpacity>
                    {tasks.length > 0 && (
                        <TouchableOpacity onPress={clearTasks} style={styles.purgeBtn}>
                            <Text style={styles.clearText}>PRIME PURGE</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <TaskFilterBar
                filterType={filterType}
                setFilterType={setFilterType}
                sortBy={sortBy}
                setSortBy={setSortBy}
                stats={stats}
                accentColor={accentColor}
            />

            <TaskInput addTask={addTask} accentColor={accentColor} />

            <FlatList
                data={hierarchyRows}
                keyExtractor={(item) => item.type === 'mission' ? `m-${item.mission.id}` : `t-${item.task.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={renderRow}
                windowSize={5}
                maxToRenderPerBatch={5}
                initialNumToRender={10}
                removeClippedSubviews={Platform.OS === 'android'}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: accentColor + '99' }]}>
                        {filterType === 'all' ? 'No tasks in queue' : `No ${filterType} tasks`}
                    </Text>
                }
            />
        </View>
    );

    // Why: Fullscreen wraps content in an absolute overlay that covers entire viewport
    if (isFullscreen) {
        return <View style={fsStyles.overlay}>{content}</View>;
    }
    return content;
});
