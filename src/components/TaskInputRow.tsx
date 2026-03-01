// Feature: Tasks | Trace: src/components/WorkflowPanel.tsx  
// Extract: Task input row (reduces parent further)

import React, { useCallback, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import { wp } from './tasks/WorkflowPanel.styles';

interface Props {
    onAddTask: (task: string) => void;
    accent: string;
}

export const TaskInputRow: React.FC<Props> = ({ onAddTask, accent }) => {
    const [input, setInput] = useState('');

    const handleAdd = useCallback(() => {
        const v = input.trim();
        if (v) {
            onAddTask(v);
            setInput('');
        }
    }, [input, onAddTask]);

    return (
        <View style={wp.inputRow}>
            <TextInput
                style={wp.input}
                value={input}
                onChangeText={setInput}
                placeholder="Add task or paste goal…"
                placeholderTextColor="rgba(255,255,255,0.18)"
                onSubmitEditing={handleAdd}
                returnKeyType="done"
                {...(Platform.OS === 'web' ? { onKeyPress: (e: any) => e.key === 'Enter' && handleAdd() } : {})}
            />
            <TouchableOpacity onPress={handleAdd} style={[wp.addBtn, { backgroundColor: accent }]}>
                <Text style={wp.addBtnText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};
