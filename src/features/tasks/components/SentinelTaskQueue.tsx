// Feature: Tasks | Trace: src/features/tasks/trace.md
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItem } from '../types';
import { Scanline } from '../../../components/Scanline';
import { SentinelTaskItem } from './SentinelTaskItem';
import { styles } from './SentinelTaskQueue/SentinelTaskQueue.styles';

interface Props {
    tasks: TaskItem[];
    onCancelTask: (id: string) => void;
    onRetryTask: (id: string) => void;
    theme: 'red' | 'blue';
}

export const SentinelTaskQueue: React.FC<Props> = ({ tasks, onCancelTask, onRetryTask, theme }) => {
    const accent = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['rgba(15, 10, 25, 0.9)', 'rgba(5, 5, 8, 0.98)']} style={StyleSheet.absoluteFill} />
            <Scanline color={accent} opacity={0.05} duration={8000} />
            <View style={styles.header}>
                <Text style={[styles.headerText, { textShadowColor: accent }]}>TASK ORCHESTRATOR</Text>
                <View style={[styles.statusDot, { backgroundColor: accent, shadowColor: accent }]} />
            </View>
            <ScrollView contentContainerStyle={styles.listContent}>
                {tasks.length === 0 ? (
                    <Text style={styles.emptyText}>No active workflows in queue.</Text>
                ) : (
                    tasks.map((task) => (
                        <SentinelTaskItem key={task.id} task={task} accent={accent} onCancel={onCancelTask} onRetry={onRetryTask} />
                    ))
                )}
            </ScrollView>
        </View>
    );
};
