// Feature: Tasks | Trace: src/features/tasks/trace.md
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { TaskItem, TaskStatus } from '../../features/tasks/types';
import { styles } from './TaskQueueUI.styles';

interface Props {
    item: TaskItem; accentColor: string;
    removeTask: (id: string) => void;
    editTask: (id: string, title: string) => void;
}

export const TaskItemView = React.memo(({ item, accentColor, removeTask, editTask }: Props) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.title);

    const getStatusColor = (s: TaskStatus) => {
        if (s === 'completed') return '#4caf50';
        if (s === 'failed') return '#f44336';
        if (s === 'in_progress') return accentColor;
        return '#333';
    };

    const save = () => { editTask(item.id, editValue); setIsEditing(false); };

    return (
        <Animatable.View animation="fadeInRight" duration={400} style={[styles.taskCard, item.status === 'in_progress' && { borderColor: accentColor, ...Platform.select({ native: { shadowColor: accentColor, shadowOpacity: 0.3, shadowRadius: 15 } }) }]}>
            <View style={[styles.statusVertical, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.cardInfo}>
                {isEditing ? (
                    <TextInput autoFocus style={styles.editInput} value={editValue} onChangeText={setEditValue} onBlur={save} onSubmitEditing={save} />
                ) : (
                    <TouchableOpacity onLongPress={() => setIsEditing(true)}>
                        <Text style={[styles.taskTitle, item.status === 'completed' && { color: 'rgba(255,255,255,0.3)' }]}>{item.title.toUpperCase()}</Text>
                        {Boolean(item.details) && <Text style={styles.taskDetails} numberOfLines={2}>{item.details}</Text>}
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity onPress={() => removeTask(item.id)} style={styles.cardAction}><Text style={[styles.closeIcon, { color: 'rgba(255,255,255,0.2)' }]}>×</Text></TouchableOpacity>
        </Animatable.View>
    );
});
