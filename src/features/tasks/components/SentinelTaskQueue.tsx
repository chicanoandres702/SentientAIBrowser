import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItem, TaskStatus } from '../types';
import { Scanline } from '../../../components/Scanline';

interface Props {
    tasks: TaskItem[];
    onCancelTask: (id: string) => void;
    onRetryTask: (id: string) => void;
    theme: 'red' | 'blue';
}

const StatusIcon = ({ status, color }: { status: TaskStatus, color: string }) => {
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

export const SentinelTaskQueue: React.FC<Props> = ({ tasks, onCancelTask, onRetryTask, theme }) => {
    const accent = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(15, 10, 25, 0.9)', 'rgba(5, 5, 8, 0.98)']}
                style={StyleSheet.absoluteFill}
            />
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
                        <Animatable.View 
                            key={task.id} 
                            animation="fadeInRight" 
                            duration={500} 
                            style={styles.taskItem}
                        >
                            <View style={styles.taskMain}>
                                <View style={styles.statusCol}>
                                    <StatusIcon status={task.status} color={accent} />
                                </View>
                                <View style={styles.infoCol}>
                                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                                    <Text style={styles.taskTime}>
                                        {new Date(task.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>

                            {task.details && (
                                <Text style={styles.taskDetails} numberOfLines={2}>{task.details}</Text>
                            )}

                            <View style={styles.actionRow}>
                                {(task.status === 'in_progress' || task.status === 'pending') && (
                                    <TouchableOpacity 
                                        style={styles.actionBtn} 
                                        onPress={() => onCancelTask(task.id)}
                                    >
                                        <Text style={styles.actionBtnText}>CANCEL</Text>
                                    </TouchableOpacity>
                                )}
                                {(task.status === 'failed' || task.status === 'blocked_on_user') && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { borderColor: accent }]} 
                                        onPress={() => onRetryTask(task.id)}
                                    >
                                        <Text style={[styles.actionBtnText, { color: accent }]}>RETRY</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </Animatable.View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: '#050505',
    },
    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    listContent: {
        padding: 15,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 40,
        fontStyle: 'italic',
    },
    taskItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    taskMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusCol: {
        width: 30,
        alignItems: 'center',
    },
    infoCol: {
        flex: 1,
        marginLeft: 10,
    },
    taskTitle: {
        color: '#eee',
        fontSize: 13,
        fontWeight: 'bold',
    },
    taskTime: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
        marginTop: 2,
    },
    taskDetails: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        marginTop: 8,
        lineHeight: 16,
        paddingLeft: 40,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 8,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionBtnText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
