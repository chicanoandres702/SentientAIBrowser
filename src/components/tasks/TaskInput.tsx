// Feature: Tasks | Trace: src/features/tasks/trace.md
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { styles } from './TaskQueueUI.styles';

interface Props {
    addTask: (t: string) => void; accentColor: string;
}

export const TaskInput = ({ addTask, accentColor }: Props) => {
    const [title, setTitle] = useState('');
    const handleAdd = () => { if (title.trim()) { addTask(title.trim()); setTitle(''); } };

    return (
        <View style={styles.taskInputWrapper}>
            <TextInput style={styles.taskInput} placeholder="ASSIGN NEURAL TASK..." placeholderTextColor="rgba(255,255,255,0.2)" value={title} onChangeText={setTitle} onSubmitEditing={handleAdd} />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: accentColor }]} onPress={handleAdd}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
        </View>
    );
};
