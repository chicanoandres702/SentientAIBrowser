// Feature: Tasks | Why: Lean orchestrator — filter logic + filter UI extracted
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItemView } from './tasks/TaskItemView';
import { TaskInput } from './tasks/TaskInput';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { styles } from './tasks/TaskQueueUI.styles';
import { uiColors } from '../features/ui/theme/ui.theme';
import { FilterType, SortMode, getTaskStats, useFilteredTasks, useActiveMission } from './tasks/task-filter.utils';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
}

export const TaskQueueUI: React.FC<Props> = React.memo(({
    tasks, theme, addTask, removeTask, clearTasks, editTask,
}) => {
    const colors = uiColors(theme);
    const accentColor = colors.accent;
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortMode>('time');

    const filteredTasks = useFilteredTasks(tasks, filterType, sortBy);
    const activeMission = useActiveMission(tasks);
    const stats = getTaskStats(tasks);

    const renderItem = useCallback(
        ({ item }: { item: TaskItem }) => (
            <TaskItemView item={item} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
        ),
        [accentColor, removeTask, editTask],
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.panel, colors.panel2]} style={styles.absoluteGradient} />

            <View style={styles.headerRow}>
                <View>
                    <Text style={[styles.header, { color: accentColor }]}>AGENT INTEL</Text>
                    <Text style={styles.subHeader}>NEURAL SYNC ACTIVE</Text>
                </View>
                {tasks.length > 0 && (
                    <TouchableOpacity onPress={clearTasks} style={styles.purgeBtn}>
                        <Text style={styles.clearText}>PRIME PURGE</Text>
                    </TouchableOpacity>
                )}
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

            {activeMission && (
                <View style={{ backgroundColor: 'rgba(0,210,255,0.06)', borderWidth: 1, borderColor: accentColor + '44', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                    <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 1.2, color: accentColor, marginBottom: 4 }}>📋 ACTIVE MISSION</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }} numberOfLines={2}>{activeMission.title.toUpperCase()}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                        <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ width: `${activeMission.progress || 0}%`, height: '100%', backgroundColor: accentColor, borderRadius: 2 }} />
                        </View>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: accentColor }}>{activeMission.progress || 0}%</Text>
                    </View>
                    {activeMission.details ? <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{activeMission.details}</Text> : null}
                </View>
            )}

            <FlatList
                data={filteredTasks}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={renderItem}
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
});
