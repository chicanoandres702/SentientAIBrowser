// Feature: Tasks | Why: Compact per-task action row — retry/play/allow-me buttons
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Per-task action buttons
 * [Subtask] TaskActionRow: retry (failed), play (pending), allow-me (active/pending)
 * [Upstream] TaskItemView -> [Downstream] useTaskQueue + proxy-routes-tasks
 * [Law Check] 47 lines | Passed 100-Line Law
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TaskStatus } from '../../features/tasks/types';

interface Props {
    taskId: string;
    status: TaskStatus;
    onPlay?:    (id: string) => void;
    onRetry?:   (id: string) => void;
    onAllowMe?: (id: string) => void;
}

export const TaskActionRow: React.FC<Props> = ({ taskId, status, onPlay, onRetry, onAllowMe }) => {
    const canPlay    = status === 'pending'          && !!onPlay;
    const canRetry   = status === 'failed'           && !!onRetry;
    const canAllowMe = (status === 'in_progress' || status === 'pending') && !!onAllowMe;

    if (!canPlay && !canRetry && !canAllowMe) return null;

    return (
        <View style={s.row}>
            {canPlay && (
                <TouchableOpacity onPress={() => onPlay!(taskId)} style={s.btn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[s.label, s.play]}>▶ Play</Text>
                </TouchableOpacity>
            )}
            {canRetry && (
                <TouchableOpacity onPress={() => onRetry!(taskId)} style={s.btn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[s.label, s.retry]}>↩ Retry</Text>
                </TouchableOpacity>
            )}
            {canAllowMe && (
                <TouchableOpacity onPress={() => onAllowMe!(taskId)} style={s.btn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Text style={[s.label, s.allow]}>✋ Me</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    row:   { flexDirection: 'row', gap: 5, marginTop: 6 },
    btn:   { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
    label: { fontSize: 9, fontWeight: '600' },
    play:  { color: '#00d2ff' },
    retry: { color: '#ff9800' },
    allow: { color: '#fbbf24' },
});
