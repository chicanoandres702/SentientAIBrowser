// Feature: Tasks | Why: Swipeable mobile task card with inline quick actions and sub-action expand
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem, SubAction } from '../../../features/tasks/types';
import { m } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { STATUS_CFG } from './mobile-status.config';
import { cardStyles as s } from './MobileTaskCard.styles';

interface Props {
    item: TaskItem;
    accentColor: string;
    removeTask: (id: string) => void;
    editTask: (id: string, title: string) => void;
    index: number;
}

const SubActionIcon = ({ action }: { action: string }) => {
    const icon = action === 'click' ? '🖱' : action === 'type' ? '⌨' : action === 'wait' ? '⏳'
        : action === 'navigate' ? '🧭' : action === 'scan_dom' ? '🔍' : action === 'verify' ? '✅'
        : action === 'interact' ? '👆' : action === 'done' ? '🏁' : '▸';
    return <Text style={{ fontSize: 10, width: 16 }}>{icon}</Text>;
};

export const MobileTaskCard: React.FC<Props> = ({ item, accentColor, removeTask, editTask: _editTask, index }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CFG[item.status];
    const hasSubActions = item.subActions && item.subActions.length > 0;
    const isActive = item.status === 'in_progress';
    const isDone = item.status === 'completed';
    const elapsed = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : null;
    const elapsedStr = elapsed ? (elapsed >= 60 ? `${Math.floor(elapsed / 60)}m` : `${elapsed}s`) : null;

    return (
        <Animatable.View animation="fadeInUp" delay={index * 60} duration={350} style={[s.card, m.shadowSm, isActive && { borderColor: accentColor + '66' }]}>
            <View style={[s.statusStrip, { backgroundColor: cfg.color }]} />
            <TouchableOpacity style={s.body} onPress={hasSubActions ? () => setExpanded(!expanded) : undefined} activeOpacity={0.7}>
                <View style={s.titleRow}>
                    <View style={s.titleLeft}>
                        <Text style={[s.statusIcon, { color: cfg.color }]}>{cfg.icon}</Text>
                        <Text style={[m.h3, isDone && s.doneTitle, { flex: 1 }]} numberOfLines={2}>{item.title}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeTask(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={s.dismiss}>×</Text></TouchableOpacity>
                </View>
                <View style={s.metaRow}>
                    <View style={[s.statusChip, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '44' }]}><Text style={[s.statusChipText, { color: cfg.color }]}>{cfg.label}</Text></View>
                    {elapsedStr && <Text style={[s.metaText, { color: accentColor }]}>⏱ {elapsedStr}</Text>}
                    {hasSubActions && <Text style={[s.metaText, { color: accentColor }]}>{expanded ? '▼' : '▶'} {item.subActions!.length} action{item.subActions!.length !== 1 ? 's' : ''}</Text>}
                </View>
                {(isActive || isDone) && item.progress !== undefined && (
                    <View style={s.progressRow}><View style={s.progressTrack}><View style={[s.progressFill, { width: `${item.progress}%`, backgroundColor: accentColor }]} /></View><Text style={[s.progressPct, { color: accentColor }]}>{item.progress}%</Text></View>
                )}
                {item.details && <Text style={[m.body, { marginTop: 4, fontSize: 9 }]} numberOfLines={expanded ? 5 : 1}>{item.details}</Text>}
                {expanded && hasSubActions && (
                    <Animatable.View animation="fadeIn" duration={200} style={s.subActions}>
                        {item.subActions!.map((sa: SubAction, idx: number) => (
                            <View key={idx} style={s.subRow}><SubActionIcon action={sa.action} /><Text style={s.subText} numberOfLines={1}>{sa.explanation}</Text><View style={[s.subStatusDot, { backgroundColor: sa.status === 'completed' ? BASE.success : sa.status === 'in_progress' ? accentColor : BASE.textFaint }]} /></View>
                        ))}
                    </Animatable.View>
                )}
            </TouchableOpacity>
            {isActive && <Animatable.View animation="pulse" iterationCount="infinite" duration={3000} style={[s.activeGlow, { backgroundColor: accentColor + '08' }]} />}
        </Animatable.View>
    );
};
