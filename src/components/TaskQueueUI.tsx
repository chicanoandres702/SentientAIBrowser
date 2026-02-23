import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { TaskItem, TaskStatus } from '../features/tasks/types';
import { AppTheme } from '../../App';

interface Props {
    tasks: TaskItem[];
    theme: AppTheme;
}

export const TaskQueueUI: React.FC<Props> = ({ tasks, theme }) => {
    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'completed': return '#4caf50';
            case 'failed': return '#f44336';
            case 'in_progress': return theme === 'red' ? '#ff003c' : '#00d2ff';
            case 'blocked_on_user': return '#ff9800'; // Orange for blocked
            default: return '#777';
        }
    };

    if (tasks.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>AGENT INTEL</Text>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[
                        styles.taskRow,
                        item.status === 'blocked_on_user' && { borderColor: '#ff9800' }
                    ]}>
                        <View style={styles.statusIconBox}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                        </View>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle} numberOfLines={1}>
                                {item.status === 'in_progress' ? '⚡ ' : ''}
                                {item.title}
                                {item.details ? ` » ${item.details}` : ''}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
        padding: 15,
    },
    header: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 15,
        color: '#333',
        letterSpacing: 2,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#0a0a0a',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#111',
    },
    statusIconBox: {
        marginRight: 10,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 12,
        color: '#aaa',
        fontWeight: '500',
        fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    }
});
