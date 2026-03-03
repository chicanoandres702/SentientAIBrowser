// Feature: Tasks | Why: Expandable task row — status dot, title, action count; expands to SubAction timeline
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TaskItem, TaskStatus } from '../../features/tasks/types';
import { wp } from './WorkflowPanel.styles';
import { TaskActionRow } from './TaskActionRow';

interface Props {
    item: TaskItem;
    accentColor: string;
    removeTask: (id: string) => void;
    onPlay?:    (id: string) => void;
    onRetry?:   (id: string) => void;
    onAllowMe?: (id: string) => void;
}

const DOT: Record<TaskStatus, string> = {
    pending: 'rgba(140,160,200,0.22)',
    in_progress: '#00d2ff',
    completed: '#00ffaa',
    failed: '#ff5555',
    blocked_on_user: '#fbbf24',
};

const BADGE: Record<TaskStatus, string> = {
    pending: 'rgba(140,160,200,0.45)',
    in_progress: '#00d2ff',
    completed: '#00ffaa',
    failed: '#ff5555',
    blocked_on_user: '#fbbf24',
};

const LABEL: Record<TaskStatus, string> = {
    pending: 'PENDING',
    in_progress: 'ACTIVE',
    completed: 'DONE',
    failed: 'FAILED',
    blocked_on_user: 'PAUSED',
};

export const WorkflowTaskRow: React.FC<Props> = React.memo(({ item, accentColor, removeTask, onPlay, onRetry, onAllowMe }) => {
    const actions = item.subActions ?? [];
    const canExpand = actions.length > 0;
    // Why: initial state auto-expands in_progress tasks
    const [expanded, setExpanded] = useState(item.status === 'in_progress' && canExpand);
    // Why: status can change from pending→in_progress after mount — sync expanded accordingly
    useEffect(() => {
        if (item.status === 'in_progress' && canExpand) setExpanded(true);
    }, [item.status, canExpand]);
    const done = item.status === 'completed';

    return (
        <TouchableOpacity
            activeOpacity={0.78}
            onPress={canExpand ? () => setExpanded(e => !e) : undefined}
            style={[wp.taskRow, item.status === 'in_progress' && wp.taskRowActive, done && wp.taskRowDone]}
        >
            <View style={[wp.statusDot, { backgroundColor: DOT[item.status] }]} />

            <View style={wp.taskBody}>
                <Text style={[wp.taskTitle, done && wp.taskTitleDone]} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={wp.taskMeta}>
                    <Text style={[wp.taskBadge, { color: BADGE[item.status] }]}>{LABEL[item.status]}</Text>
                    {actions.length > 0 && (
                        <Text style={wp.taskActionCount}>
                            {actions.length} action{actions.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                <TaskActionRow taskId={item.id} status={item.status} onPlay={onPlay} onRetry={onRetry} onAllowMe={onAllowMe} />

                {/* SubAction timeline — visible when expanded */}
                {canExpand && expanded && (
                    <View style={wp.actionsContainer}>
                        {actions.map((a, i) => {
                            const aDone = a.status === 'completed';
                            const aActive = a.status === 'in_progress';
                            return (
                                <View key={i} style={wp.actionRow}>
                                    <View style={[wp.actionDot, {
                                        backgroundColor: aDone ? '#00ffaa' : aActive ? accentColor : 'rgba(140,160,200,0.18)',
                                    }]} />
                                    <Text
                                        style={[wp.actionText, aDone && wp.actionDoneText, aActive && wp.actionActiveText]}
                                        numberOfLines={2}
                                    >
                                        {a.action}
                                    </Text>
                                    {aDone && <Text style={wp.actionCheck}>✓</Text>}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {canExpand && <Text style={wp.chevron}>{expanded ? '▾' : '▸'}</Text>}

            <TouchableOpacity
                onPress={() => removeTask(item.id)}
                style={wp.removeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={wp.removeIcon}>×</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
});
