// Feature: Tasks | Why: Mobile mission header — sticky collapsible banner with live progress
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem } from '../../../features/tasks/types';
import { m, MOBILE } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { missionHeaderStyles as s } from './MobileMissionHeader.styles';

interface Props {
    mission: TaskItem | null;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    accentColor: string;
}

const StatChip = ({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) => (
    <View style={s.statChip}><Text style={{ fontSize: 10 }}>{icon}</Text><Text style={[s.statValue, { color }]}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>
);

export const MobileMissionHeader: React.FC<Props> = ({
    mission, totalTasks, completedTasks, failedTasks, accentColor,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const progress = mission?.progress || 0;
    const activeTasks = totalTasks - completedTasks - failedTasks;

    if (!mission) {
        return (
            <View style={[s.idle, m.glassSm]}>
                <Text style={[m.caption, { color: accentColor }]}>🛰 STANDING BY</Text>
                <Text style={[m.label, { marginTop: 4 }]}>Enter a prompt to begin a mission</Text>
            </View>
        );
    }

    return (
        <Animatable.View animation="fadeInDown" duration={350} style={[s.container, m.glass, m.shadow]}>
            <TouchableOpacity style={s.header} onPress={() => setCollapsed(!collapsed)} activeOpacity={0.7}>
                <View style={s.headerLeft}>
                    <Animatable.View animation="pulse" iterationCount="infinite" duration={2000} style={[s.orb, { backgroundColor: accentColor }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={[m.caption, { color: accentColor }]}>📋 ACTIVE MISSION</Text>
                        <Text style={[m.h2, { marginTop: 2 }]} numberOfLines={collapsed ? 1 : 2}>{mission.title.toUpperCase()}</Text>
                    </View>
                </View>
                <View style={s.headerRight}>
                    <Text style={[s.progressText, { color: accentColor }]}>{progress}%</Text>
                    <Text style={[m.mono, { fontSize: 8 }]}>{collapsed ? '▼' : '▲'}</Text>
                </View>
            </TouchableOpacity>
            {!collapsed && (
                <Animatable.View animation="fadeIn" duration={200}>
                    <View style={s.progressTrack}>
                        <Animatable.View animation={{ from: { width: '0%' }, to: { width: `${progress}%` } }} duration={800} style={[s.progressFill, { backgroundColor: accentColor }]} />
                    </View>
                    <View style={s.statsRow}>
                        <StatChip icon="⚡" label="ACTIVE" value={activeTasks} color={accentColor} />
                        <StatChip icon="✓" label="DONE" value={completedTasks} color={BASE.success} />
                        <StatChip icon="✕" label="FAIL" value={failedTasks} color={BASE.danger} />
                        <StatChip icon="∑" label="TOTAL" value={totalTasks} color={BASE.textMuted} />
                    </View>
                    {mission.details && <Text style={[m.body, { marginTop: 6, paddingHorizontal: MOBILE.pad }]} numberOfLines={1}>{mission.details}</Text>}
                </Animatable.View>
            )}
        </Animatable.View>
    );
};
