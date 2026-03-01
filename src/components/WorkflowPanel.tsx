// Feature: Tasks | Why: Single active-workflow view — mission header + flat expandable task list
import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';
import { useActiveMission, useFilteredTasks } from './tasks/task-filter.utils';
import { MissionQueueControls } from './tasks/MissionQueueControls';
import { SaveRoutineModal } from './tasks/SaveRoutineModal';
import { WorkflowTaskRow } from './tasks/WorkflowTaskRow';
import { wp } from './tasks/WorkflowPanel.styles';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
    isPaused?: boolean;
    onPause?: () => void;
    onResume?: () => void;
    proxyBaseUrl?: string;
    onCloseMission?: (missionId: string, tabId?: string) => void;
    activeTabId?: string;
}

type SaveModal = { goal: string; tasks: TaskItem[] } | null;

export const WorkflowPanel: React.FC<Props> = ({
    tasks, theme, addTask, removeTask, clearTasks,
    isPaused = false, onPause, onResume, proxyBaseUrl = '', onCloseMission, activeTabId,
}) => {
    const colors = uiColors(theme);
    const accent = colors.accent;
    const [input, setInput] = useState('');
    const [saveModal, setSaveModal] = useState<SaveModal>(null);

    // Why: scope to the active tab so other workspaces' tasks don't bleed into this panel
    const tabTasks = useMemo(
        () => activeTabId ? tasks.filter(t => t.tabId === activeTabId) : tasks,
        [tasks, activeTabId],
    );
    const mission = useActiveMission(tabTasks);
    const taskList = useFilteredTasks(tabTasks, 'all', 'time');

    const completedCount = taskList.filter(t => t.status === 'completed').length;
    const total = taskList.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const isActive = tabTasks.some(t => t.status === 'in_progress');
    const barColor = pct === 100 ? '#00ffaa' : accent;

    const handleAdd = useCallback(() => {
        const v = input.trim();
        if (v) { addTask(v); setInput(''); }
    }, [input, addTask]);

    return (
        <ScrollView contentContainerStyle={wp.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── Header ── */}
            <View style={wp.headerRow}>
                <View>
                    <Text style={[wp.headerTitle, { color: accent }]}>TASKS</Text>
                    <Text style={wp.headerSub}>{isActive ? 'WORKFLOW ACTIVE' : 'STANDBY'}</Text>
                </View>
                {tasks.length > 0 && (
                    <TouchableOpacity onPress={clearTasks} style={wp.purgeBtn}>
                        <Text style={wp.purgeText}>PURGE</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Input ── */}
            <View style={wp.inputRow}>
                <TextInput
                    style={wp.input} value={input} onChangeText={setInput}
                    placeholder="Add task or paste goal…" placeholderTextColor="rgba(255,255,255,0.18)"
                    onSubmitEditing={handleAdd} returnKeyType="done"
                    {...(Platform.OS === 'web' ? { onKeyPress: (e: any) => e.key === 'Enter' && handleAdd() } : {})}
                />
                <TouchableOpacity onPress={handleAdd} style={[wp.addBtn, { backgroundColor: accent }]}>
                    <Text style={wp.addBtnText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* ── Active workflow card ── */}
            {mission && (
                <View style={[wp.wfCard, { borderColor: accent + '33', backgroundColor: accent + '08' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[wp.wfLabel, { color: accent }]}>⚡ ACTIVE WORKFLOW</Text>
                            <Text style={wp.wfTitle}>{mission.title}</Text>
                        </View>
                        {onCloseMission && (
                            <TouchableOpacity
                                onPress={() => onCloseMission(mission.id, mission.tabId)}
                                style={[wp.purgeBtn, { borderColor: accent + '44', marginLeft: 8 }]}
                            >
                                <Text style={[wp.purgeText, { color: accent }]}>✕ END</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={wp.wfProgressRow}>
                        <View style={wp.wfTrack}>
                            <View style={[wp.wfBar, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                        </View>
                        <Text style={[wp.wfPct, { color: barColor }]}>{pct === 100 ? '✓' : `${pct}%`}</Text>
                    </View>
                    <Text style={wp.wfStats}>{completedCount} / {total} tasks done</Text>
                    <MissionQueueControls
                        missionId={mission.id} isActive={isActive} isPaused={isPaused}
                        onPlay={() => onResume?.()} onPause={() => onPause?.()}
                        onStop={() => { onPause?.(); setSaveModal({ goal: mission.title, tasks: taskList }); }}
                        onSave={() => setSaveModal({ goal: mission.title, tasks: taskList })}
                        accentColor={accent}
                    />
                </View>
            )}

            {/* ── Task list ── */}
            {taskList.length > 0 && (
                <>
                    <Text style={wp.sectionLabel}>TASKS</Text>
                    {taskList.map(t => (
                        <WorkflowTaskRow key={t.id} item={t} accentColor={accent} removeTask={removeTask} />
                    ))}
                </>
            )}

            {taskList.length === 0 && (
                <View style={wp.emptyWrap}>
                    <Text style={wp.emptyIcon}>⚡</Text>
                    <Text style={wp.emptyText}>No tasks yet — add one above</Text>
                </View>
            )}

            {saveModal && (
                <SaveRoutineModal visible goal={saveModal.goal} tasks={saveModal.tasks}
                    proxyBaseUrl={proxyBaseUrl} accentColor={accent} onClose={() => setSaveModal(null)} />
            )}
        </ScrollView>
    );
};
