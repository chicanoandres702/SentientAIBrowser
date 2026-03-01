// Feature: Tasks | Why: Hierarchical mission→task rendering with fullscreen toggle
import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItemView } from './tasks/TaskItemView';
import { TaskInput } from './tasks/TaskInput';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { styles } from './tasks/TaskQueueUI.styles';
import { MissionCard } from './tasks/MissionCard';
import { uiColors } from '../features/ui/theme/ui.theme';
import { FilterType, SortMode, getTaskStats } from './tasks/task-filter.utils';
import { useMissionNodes } from './tasks/mission-nodes.utils';
import type { MissionNode } from './tasks/mission-nodes.utils';
import { fsStyles } from './tasks/task-queue-fullscreen.styles';

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
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { missions, orphans } = useMissionNodes(tasks, filterType, sortBy);
    const stats = getTaskStats(tasks);

    const renderMissionCard = useCallback((node: MissionNode) => (
        <MissionCard node={node} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
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
