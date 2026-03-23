// Feature: Tasks | Why: "Stream" mobile layout — continuous vertical feed with inline prompt
// Layout 2 of 3: Infinite-scroll feed — mission + tasks + prompt all in one scrollable stream
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { TaskItem } from '../../../features/tasks/types';
import { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { useHierarchicalTasks, useActiveMission, getTaskStats, SortMode, HierarchyRow } from '../task-filter.utils';
import { MobileTaskCard } from './MobileTaskCard';
import { m } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { streamStyles as s } from './MobileStreamLayout.styles';
import { streamExtraStyles as sx } from './MobileStreamLayout.extra.styles';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
}

const StatPill = ({ icon, value, color }: { icon: string; value: number; color: string }) => (
    <View style={[s.statPill, { borderColor: color + '33' }]}>
        <Text style={{ fontSize: 9 }}>{icon}</Text>
        <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
);

/** Layout 2: STREAM — Everything in one vertical feed. Thumb-zone optimised. */
export const MobileStreamLayout: React.FC<Props> = ({
    tasks, theme, addTask, removeTask, clearTasks, editTask,
}) => {
    const colors = uiColors(theme);
    const accent = colors.accent;
    const [sortBy, setSortBy] = useState<SortMode>('time');
    const [promptValue, setPromptValue] = useState('');
    const listRef = useRef<FlatList>(null);

    const activeMission = useActiveMission(tasks);
    const hierarchy = useHierarchicalTasks(tasks, 'all', sortBy);
    const stats = getTaskStats(tasks);
    const progress = activeMission?.progress || 0;

    const handleSubmit = () => { if (promptValue.trim()) { addTask(promptValue.trim()); setPromptValue(''); } };

    const renderHierarchyRow = useCallback(({ item, index }: { item: HierarchyRow; index: number }) => {
        if (item.type === 'mission') {
            const pct = item.totalCount > 0 ? Math.round((item.completedCount / item.totalCount) * 100) : 0;
            return (
                <Animatable.View animation="fadeIn" duration={200} style={sx.streamMissionRow}>
                    <View style={[sx.streamMissionDot, { backgroundColor: accent }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[m.h3, { fontSize: 10 }]} numberOfLines={1}>{item.mission.title}</Text>
                        <View style={sx.streamMissionMeta}>
                            <View style={sx.streamMissionTrack}><View style={[sx.streamMissionFill, { width: `${pct}%`, backgroundColor: accent }]} /></View>
                            <Text style={[sx.streamMissionLabel, { color: accent }]}>{item.completedCount}/{item.totalCount}</Text>
                        </View>
                    </View>
                </Animatable.View>
            );
        }
        return (
            <View style={sx.streamIndent}>
                <View style={sx.streamTree}>
                    <View style={[sx.streamTreeVert, !item.isLast && sx.streamTreeVertFull, { backgroundColor: accent + '22' }]} />
                    <View style={[sx.streamTreeHoriz, { backgroundColor: accent + '22' }]} />
                </View>
                <View style={{ flex: 1 }}><MobileTaskCard item={item.task} accentColor={accent} removeTask={removeTask} editTask={editTask} index={index} /></View>
            </View>
        );
    }, [accent, removeTask, editTask]);

    const ListHeader = (
        <View>
            <View style={[s.promptBar, m.glass]}>
                <TextInput style={s.promptInput} placeholder="Describe your mission..." placeholderTextColor={BASE.textFaint} value={promptValue} onChangeText={setPromptValue} onSubmitEditing={handleSubmit} returnKeyType="send" />
                <TouchableOpacity style={[s.sendBtn, { backgroundColor: accent }]} onPress={handleSubmit}><Text style={s.sendIcon}>→</Text></TouchableOpacity>
            </View>
            {activeMission && (
                <Animatable.View animation="fadeIn" duration={300} style={s.missionStrip}>
                    <View style={s.missionRow}><Animatable.View animation="pulse" iterationCount="infinite" duration={2000} style={[s.missionDot, { backgroundColor: accent }]} /><Text style={[m.h3, { flex: 1 }]} numberOfLines={1}>{activeMission.title}</Text><Text style={[s.missionPct, { color: accent }]}>{progress}%</Text></View>
                    <View style={s.missionTrack}><Animatable.View animation={{ from: { width: '0%' }, to: { width: `${progress}%` } }} duration={600} style={[s.missionFill, { backgroundColor: accent }]} /></View>
                </Animatable.View>
            )}
            <View style={s.controlRow}>
                <View style={m.row}><StatPill icon="⚡" value={stats.active} color={accent} /><StatPill icon="✓" value={stats.completed} color={BASE.success} /><StatPill icon="✕" value={stats.failed} color={BASE.danger} /></View>
                <TouchableOpacity style={sx.sortToggle} onPress={() => setSortBy(p => p === 'time' ? 'status' : 'time')}><Text style={[sx.sortText, { color: accent }]}>{sortBy === 'time' ? '⏱ TIME' : '◆ STATUS'}</Text></TouchableOpacity>
            </View>
        </View>
    );

    const taskCount = hierarchy.filter(r => r.type === 'task').length;
    return (
        <View style={m.screen}>
            <LinearGradient colors={[colors.panel, colors.panel2]} style={StyleSheet.absoluteFill} />
            <View style={s.topBar}><Text style={[m.h1, { color: accent }]}>STREAM</Text><Text style={[m.mono, { color: accent }]}>{taskCount} task{taskCount !== 1 ? 's' : ''}</Text></View>
            <FlatList ref={listRef} data={hierarchy} keyExtractor={(row) => row.type === 'mission' ? `m-${row.mission.id}` : `t-${row.task.id}`} renderItem={renderHierarchyRow} ListHeaderComponent={ListHeader} ListFooterComponent={<View style={sx.footer}>{tasks.length > 0 && (<TouchableOpacity style={sx.clearBtn} onPress={clearTasks}><Text style={[m.caption, { color: BASE.danger }]}>🗑 CLEAR ALL TASKS</Text></TouchableOpacity>)}<View style={{ height: 40 }} /></View>} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} windowSize={5} maxToRenderPerBatch={6} initialNumToRender={10} removeClippedSubviews={Platform.OS === 'android'} ListEmptyComponent={<View style={sx.empty}><Text style={{ fontSize: 40, opacity: 0.4 }}>🛸</Text><Text style={[m.h3, { color: accent + '66', marginTop: 12 }]}>Feed is empty</Text><Text style={[m.label, { marginTop: 4 }]}>Type a mission above to get started</Text></View>} />
        </View>
    );
};
