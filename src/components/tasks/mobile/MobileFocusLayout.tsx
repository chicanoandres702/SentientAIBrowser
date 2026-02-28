// Feature: Tasks | Why: "Focus" mobile layout — one-task-at-a-time card stack with swipe navigation
// Layout 3 of 3: Card-stack focus mode — swipe through tasks one at a time
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { TaskItem } from '../../../features/tasks/types';
import { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { useFilteredTasks, useActiveMission, getTaskStats } from '../task-filter.utils';
import { m, MOBILE } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { TaskInput } from '../TaskInput';
import { FocusCardBody } from './FocusCardBody';
import { focusStyles as s } from './MobileFocusLayout.styles';
import { focusExtraStyles as sx } from './MobileFocusLayout.extra.styles';
import { STATUS_CFG } from './mobile-status.config';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
    addTask: (t: string) => void;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    editTask: (id: string, t: string) => void;
}

/** Layout 3: FOCUS — Full-screen task cards, one at a time, with swipe navigation */
export const MobileFocusLayout: React.FC<Props> = ({
    tasks, theme, addTask, removeTask, clearTasks, editTask,
}) => {
    const colors = uiColors(theme);
    const accent = colors.accent;
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showPrompt, setShowPrompt] = useState(false);

    const activeMission = useActiveMission(tasks);
    const filtered = useFilteredTasks(tasks, 'all', 'time');
    const total = filtered.length;
    const progress = activeMission?.progress || 0;

    // Mission lookup for breadcrumb context
    const missionMap = useMemo(() => {
        const map = new Map<string, TaskItem>();
        tasks.filter(t => t.isMission).forEach(mi => map.set(mi.id, mi));
        return map;
    }, [tasks]);

    const current = filtered[currentIdx] || null;
    const cfg = current ? STATUS_CFG[current.status] || STATUS_CFG.pending : null;
    const parentMission = current?.missionId ? missionMap.get(current.missionId) : null;
    const siblingTasks = useMemo(() => {
        if (!current?.missionId) return filtered;
        return filtered.filter(t => t.missionId === current.missionId);
    }, [filtered, current]);
    const siblingIdx = current ? siblingTasks.findIndex(t => t.id === current.id) : -1;

    return (
        <View style={m.screen}>
            <LinearGradient colors={[colors.panel, BASE.bgDeep]} style={StyleSheet.absoluteFill} />
            <View style={s.missionBar}>
                <View style={s.missionInfo}>
                    {activeMission ? (<>
                        <Animatable.View animation="pulse" iterationCount="infinite" duration={2000} style={[s.missionOrb, { backgroundColor: accent }]} />
                        <Text style={[m.h3, { flex: 1 }]} numberOfLines={1}>{activeMission.title}</Text>
                        <Text style={[s.pct, { color: accent }]}>{progress}%</Text>
                    </>) : (<Text style={[m.caption, { color: accent }]}>🛰 NO ACTIVE MISSION</Text>)}
                </View>
                <View style={s.missionTrack}><View style={[s.missionFill, { width: `${progress}%`, backgroundColor: accent }]} /></View>
            </View>
            {total > 0 && current && cfg ? (
                <View style={s.cardArea}>
                    {parentMission && (
                        <Animatable.View animation="fadeIn" duration={200} style={s.breadcrumb}>
                            <View style={[s.breadcrumbDot, { backgroundColor: accent }]} />
                            <Text style={[s.breadcrumbMission, { color: accent }]} numberOfLines={1}>{parentMission.title}</Text>
                            <Text style={s.breadcrumbArrow}>›</Text>
                            <Text style={s.breadcrumbPos}>{siblingIdx + 1}/{siblingTasks.length}</Text>
                        </Animatable.View>
                    )}
                    <View style={s.dots}>{filtered.map((t, i) => (
                        <TouchableOpacity key={t.id} onPress={() => setCurrentIdx(i)}>
                            <View style={[s.dot, i === currentIdx && { backgroundColor: accent, width: 16 }, t.status === 'completed' && { backgroundColor: BASE.success }, t.status === 'failed' && { backgroundColor: BASE.danger }, t.status === 'in_progress' && { backgroundColor: accent }]} />
                        </TouchableOpacity>
                    ))}</View>
                    <Animatable.View key={current.id} animation="fadeIn" duration={250} style={[sx.card, m.glass, m.shadow, { borderColor: cfg.color + '44' }]}>
                        <FocusCardBody title={current.title} status={current.status} progress={current.progress} details={current.details} startTime={current.startTime} completedTime={current.completedTime} subActions={current.subActions} accent={accent} cfg={cfg} />
                    </Animatable.View>
                    <View style={sx.navRow}>
                        <TouchableOpacity style={[sx.navBtn, currentIdx === 0 && { opacity: 0.3 }]} onPress={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}><Text style={[sx.navIcon, { color: accent }]}>◀</Text><Text style={[m.label, { color: accent }]}>PREV</Text></TouchableOpacity>
                        <Text style={[m.mono, { color: accent }]}>{currentIdx + 1} / {total}</Text>
                        <TouchableOpacity style={[sx.navBtn, currentIdx >= total - 1 && { opacity: 0.3 }]} onPress={() => setCurrentIdx(i => Math.min(total - 1, i + 1))} disabled={currentIdx >= total - 1}><Text style={[m.label, { color: accent }]}>NEXT</Text><Text style={[sx.navIcon, { color: accent }]}>▶</Text></TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={sx.emptyState}><Text style={{ fontSize: 48, opacity: 0.3 }}>🎯</Text><Text style={[m.h1, { color: accent, marginTop: 12 }]}>FOCUS MODE</Text><Text style={[m.label, { marginTop: 6, textAlign: 'center' }]}>One task at a time. Maximum clarity.</Text></View>
            )}
            <View style={sx.bottom}>{showPrompt ? (<Animatable.View animation="fadeInUp" duration={200}><TaskInput addTask={(t) => { addTask(t); setShowPrompt(false); }} accentColor={accent} /></Animatable.View>) : (
                <View style={sx.bottomRow}><TouchableOpacity style={[sx.bottomBtn, { backgroundColor: accent }]} onPress={() => setShowPrompt(true)}><Text style={sx.bottomBtnText}>+ NEW TASK</Text></TouchableOpacity>{total > 0 && (<TouchableOpacity style={sx.bottomBtnGhost} onPress={clearTasks}><Text style={[m.caption, { color: BASE.danger }]}>CLEAR</Text></TouchableOpacity>)}</View>
            )}</View>
        </View>
    );
};
