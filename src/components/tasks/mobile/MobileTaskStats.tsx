// Feature: Tasks | Why: Stats dashboard for mobile — visual counters, timing, completion ring
import React from 'react';
import { View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem } from '../../../features/tasks/types';
import { m } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { statsStyles as s } from './MobileTaskStats.styles';

interface Props { tasks: TaskItem[]; accentColor: string }

const StatTile = ({ icon, label, value, color, delay }: {
    icon: string; label: string; value: string | number; color: string; delay: number;
}) => (
    <Animatable.View animation="fadeInUp" delay={delay} duration={300} style={[s.tile, { borderColor: color + '22' }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
        <Text style={[s.tileValue, { color }]}>{value}</Text>
        <Text style={s.tileLabel}>{label}</Text>
    </Animatable.View>
);

export const MobileTaskStats: React.FC<Props> = ({ tasks, accentColor }) => {
    const regular = tasks.filter(t => !t.isMission);
    const completed = regular.filter(t => t.status === 'completed');
    const failed = regular.filter(t => t.status === 'failed');
    const active = regular.filter(t => t.status === 'in_progress');
    const pending = regular.filter(t => t.status === 'pending');
    const total = regular.length;

    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    const avgDuration = completed.length > 0
        ? Math.round(completed.reduce((sum, t) => sum + ((t.completedTime || 0) - (t.startTime || 0)), 0) / completed.length / 1000)
        : 0;
    const totalTime = regular.reduce((sum, t) => sum + ((t.completedTime || Date.now()) - (t.startTime || Date.now())), 0);
    const totalTimeSec = Math.round(totalTime / 1000);
    const totalTimeStr = totalTimeSec >= 60 ? `${Math.floor(totalTimeSec / 60)}m ${totalTimeSec % 60}s` : `${totalTimeSec}s`;

    return (
        <View style={s.container}>
            <Animatable.View animation="fadeIn" duration={400} style={[s.ringCard, m.glass, m.shadow]}>
                <View style={[s.ringOuter, { borderColor: accentColor + '22' }]}>
                    <View style={[s.ringInner, { borderColor: accentColor, borderTopColor: 'transparent', transform: [{ rotate: `${completionRate * 3.6}deg` }] }]} />
                    <View style={s.ringCenter}><Text style={[s.ringValue, { color: accentColor }]}>{completionRate}</Text><Text style={s.ringUnit}>%</Text></View>
                </View>
                <Text style={[m.caption, { color: accentColor, marginTop: 8 }]}>COMPLETION RATE</Text>
            </Animatable.View>
            <View style={s.grid}>
                <StatTile icon="⚡" label="ACTIVE" value={active.length} color={accentColor} delay={100} />
                <StatTile icon="○" label="QUEUED" value={pending.length} color={BASE.textMuted} delay={150} />
                <StatTile icon="✓" label="COMPLETED" value={completed.length} color={BASE.success} delay={200} />
                <StatTile icon="✕" label="FAILED" value={failed.length} color={BASE.danger} delay={250} />
                <StatTile icon="∑" label="TOTAL" value={total} color={BASE.info} delay={300} />
                <StatTile icon="⏱" label="AVG TIME" value={`${avgDuration}s`} color={BASE.warning} delay={350} />
            </View>
            <Animatable.View animation="fadeInUp" delay={400} duration={300} style={[s.timeline, m.glass]}>
                <Text style={[m.caption, { color: accentColor, marginBottom: 8 }]}>SESSION TIMELINE</Text>
                <View style={s.timelineRow}><Text style={[m.mono, { color: accentColor }]}>⏳</Text><Text style={m.body}>Total runtime: <Text style={{ color: accentColor, fontWeight: '700' }}>{totalTimeStr}</Text></Text></View>
                {completed.length > 0 && <View style={s.timelineRow}><Text style={[m.mono, { color: BASE.success }]}>✓</Text><Text style={m.body}>Last completed: <Text style={{ color: BASE.success, fontWeight: '700' }}>{completed[completed.length - 1].title}</Text></Text></View>}
                {failed.length > 0 && <View style={s.timelineRow}><Text style={[m.mono, { color: BASE.danger }]}>✕</Text><Text style={m.body}>Last failed: <Text style={{ color: BASE.danger, fontWeight: '700' }}>{failed[failed.length - 1].title}</Text></Text></View>}
            </Animatable.View>
        </View>
    );
};
