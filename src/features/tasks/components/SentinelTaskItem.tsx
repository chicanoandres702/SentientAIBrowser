// Feature: Tasks | Trace: src/features/tasks/trace.md
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem, TaskStatus } from '../types';
import { styles } from './SentinelTaskQueue/SentinelTaskQueue.styles';

export const StatusIcon = ({ status, color }: { status: TaskStatus, color: string }) => {
    switch (status) {
        case 'completed': return <Text style={{ color: '#00ffaa' }}>✓</Text>;
        case 'failed': return <Text style={{ color: '#ff4444' }}>✕</Text>;
        case 'blocked_on_user': return <Text style={{ color: '#ffcc00' }}>⚠</Text>;
        case 'in_progress':
            return (
                <Animatable.View animation="rotate" iterationCount="infinite" duration={2000}>
                    <Text style={{ color: color }}>⚙</Text>
                </Animatable.View>
            );
        default: return <Text style={{ color: '#888' }}>○</Text>;
    }
};

interface ItemProps {
    task: TaskItem;
    accent: string;
    onCancel: (id: string) => void;
    onRetry: (id: string) => void;
}

export const SentinelTaskItem: React.FC<ItemProps> = ({ task, accent, onCancel, onRetry }) => (
    <Animatable.View animation="fadeInRight" duration={500} style={styles.taskItem}>
        <View style={styles.taskMain}>
            <View style={styles.statusCol}><StatusIcon status={task.status} color={accent} /></View>
            <View style={styles.infoCol}>
                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                <Text style={styles.taskTime}>{new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
        </View>
        {task.details && <Text style={styles.taskDetails} numberOfLines={2}>{task.details}</Text>}
        <View style={styles.actionRow}>
            {(task.status === 'in_progress' || task.status === 'pending') && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => onCancel(task.id)}><Text style={styles.actionBtnText}>CANCEL</Text></TouchableOpacity>
            )}
            {(task.status === 'failed' || task.status === 'blocked_on_user') && (
                <TouchableOpacity style={[styles.actionBtn, { borderColor: accent }]} onPress={() => onRetry(task.id)}><Text style={[styles.actionBtnText, { color: accent }]}>RETRY</Text></TouchableOpacity>
            )}
        </View>
    </Animatable.View>
);
