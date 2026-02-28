// Feature: Tasks | Trace: src/features/tasks/trace.md
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem, TaskStatus } from '../types';
import { styles } from './SentinelTaskQueue/SentinelTaskQueue.styles';
import { TaskProgressBar } from '../../../components/tasks/TaskProgressBar';

export const StatusIcon = ({ status, color }: { status: TaskStatus, color: string }) => {
    switch (status) {
        case 'completed': return <Text style={{ color: '#00ffaa', fontSize: 16 }}>✓</Text>;
        case 'failed': return <Text style={{ color: '#ff4444', fontSize: 16 }}>✕</Text>;
        case 'blocked_on_user': return <Text style={{ color: '#ffcc00', fontSize: 16 }}>⚠</Text>;
        case 'in_progress':
            return (
                <Animatable.View animation="rotate" iterationCount="infinite" duration={2000}>
                    <Text style={{ color: color, fontSize: 16 }}>⚙</Text>
                </Animatable.View>
            );
        default: return <Text style={{ color: '#888', fontSize: 16 }}>○</Text>;
    }
};

interface ItemProps {
    task: TaskItem;
    accent: string;
    onCancel: (id: string) => void;
    onRetry: (id: string) => void;
}

const getElapsedTime = (startTime: number | undefined) => {
    if (!startTime) return null;
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

export const SentinelTaskItem: React.FC<ItemProps> = ({ task, accent, onCancel, onRetry }) => {
    const elapsedTime = getElapsedTime(task.startTime);
    const showProgress = task.status === 'in_progress' || task.status === 'completed';

    return (
        <Animatable.View animation="fadeInRight" duration={500} style={styles.taskItem}>
            <View style={styles.taskMain}>
                <View style={styles.statusCol}><StatusIcon status={task.status} color={accent} /></View>
                <View style={styles.infoCol}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <View style={localStyles.timeRow}>
                        <Text style={styles.taskTime}>{new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        {elapsedTime && <Text style={[styles.taskTime, { marginLeft: 12, color: accent }]}>⏱ {elapsedTime}</Text>}
                    </View>
                </View>
            </View>
            {task.details && <Text style={styles.taskDetails} numberOfLines={2}>{task.details}</Text>}
            {showProgress && task.progress !== undefined && (
                <View style={localStyles.progressSection}>
                    <TaskProgressBar progress={task.progress} accentColor={accent} showPercentage={true} height={3} />
                </View>
            )}
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
};

const localStyles = StyleSheet.create({
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    progressSection: {
        marginVertical: 8,
        paddingHorizontal: 12,
    },
});
