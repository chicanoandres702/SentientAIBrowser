// Feature: Tasks | Why: Hierarchical mission→task rendering with fullscreen toggle
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItemView } from './tasks/TaskItemView';
import { TaskInput } from './tasks/TaskInput';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { styles, missionStyles } from './tasks/TaskQueueUI.styles';
import { uiColors, BASE } from '../features/ui/theme/ui.theme';
import { FilterType, SortMode, getTaskStats } from './tasks/task-filter.utils';
import { useMissionNodes } from './tasks/mission-nodes.utils';
import type { MissionNode } from './tasks/mission-nodes.utils';

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

    const { missions, orphans } = useMissionNodes(tasks, filterType, sortBy);
    const stats = getTaskStats(tasks);

    const renderMissionCard = useCallback((node: MissionNode) => (
        <View style={[missionStyles.card, { borderColor: accentColor + '44' }]}>
            <Text style={[missionStyles.label, { color: accentColor }]}>📋 MISSION</Text>
            <Text style={missionStyles.title} numberOfLines={2}>{node.mission.title.toUpperCase()}</Text>
            <View style={missionStyles.progressRow}>
                <View style={missionStyles.track}>
                    <View style={[missionStyles.bar, { width: `${node.mission.progress || 0}%`, backgroundColor: accentColor }]} />
                </View>
                <Text style={[missionStyles.pct, { color: accentColor }]}>{node.mission.progress || 0}%</Text>
            </View>
            <Text style={missionStyles.details}>{node.completedCount}/{node.totalCount} tasks done{node.mission.details ? ` · ${node.mission.details}` : ''}</Text>
            <View style={missionStyles.childList}>
                {node.children.map((child: TaskItem) => (
                    <View key={child.id} style={missionStyles.childItem}>
                        <TaskItemView item={child} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
                    </View>
                ))}
            </View>
        </View>
    ), [accentColor, removeTask, editTask]);

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
                data={[...missions, ...orphans]}
                keyExtractor={(item) => 'mission' in item ? `m-${item.mission.id}` : `t-${item.id}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    'mission' in item
                        ? renderMissionCard(item)
                        : <TaskItemView item={item as TaskItem} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
                )}
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
