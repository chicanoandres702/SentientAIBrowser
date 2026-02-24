// Feature: Tasks | Trace: src/features/tasks/trace.md
import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskItemView } from './tasks/TaskItemView';
import { TaskInput } from './tasks/TaskInput';
import { styles } from './tasks/TaskQueueUI.styles';

interface Props {
    tasks: TaskItem[]; theme: AppTheme; addTask: (t: string) => void;
    removeTask: (id: string) => void; clearTasks: () => void; editTask: (id: string, t: string) => void;
}

export const TaskQueueUI: React.FC<Props> = React.memo(({ tasks, theme, addTask, removeTask, clearTasks, editTask }) => {
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';
    
    const renderItem = useCallback(({ item }: { item: TaskItem }) => (
        <TaskItemView item={item} accentColor={accentColor} removeTask={removeTask} editTask={editTask} />
    ), [accentColor, removeTask, editTask]);

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme === 'red' ? ['rgba(30,0,10,0.95)', '#0a0005'] : ['rgba(0,20,30,0.95)', '#000a0f']} style={styles.absoluteGradient} />
            <View style={styles.headerRow}>
                <View><Text style={[styles.header, { color: accentColor }]}>AGENT INTEL</Text><Text style={styles.subHeader}>NEURAL SYNC ACTIVE</Text></View>
                {tasks.length > 0 && <TouchableOpacity onPress={clearTasks} style={styles.purgeBtn}><Text style={styles.clearText}>PRIME PURGE</Text></TouchableOpacity>}
            </View>
            <TaskInput addTask={addTask} accentColor={accentColor} />
            <FlatList
                data={tasks} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={renderItem}
            />
        </View>
    );
});
