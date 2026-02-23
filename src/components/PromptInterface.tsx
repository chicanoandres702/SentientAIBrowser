import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
    onExecutePrompt: (prompt: string) => void;
}

export const PromptInterface: React.FC<Props> = ({ onExecutePrompt }) => {
    const [prompt, setPrompt] = useState('');

    const handleSend = () => {
        if (prompt.trim()) {
            onExecutePrompt(prompt);
            setPrompt('');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="e.g. 'Go to Google and search for cute cats'"
                value={prompt}
                onChangeText={setPrompt}
                multiline
            />
            <TouchableOpacity style={styles.button} onPress={handleSend}>
                <Text style={styles.buttonText}>Execute</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100,
    },
    button: {
        backgroundColor: '#000',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
