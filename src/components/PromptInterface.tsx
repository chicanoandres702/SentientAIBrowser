import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { AppTheme } from '../../App';

interface Props {
    onExecutePrompt: (prompt: string) => void;
    theme: AppTheme;
}

export const PromptInterface: React.FC<Props> = ({ onExecutePrompt, theme }) => {
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
                style={[
                    styles.input,
                    {
                        borderColor: theme === 'red' ? 'rgba(255, 0, 60, 0.4)' : 'rgba(0, 210, 255, 0.4)',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                    }
                ]}
                placeholderTextColor="#666"
                placeholder="e.g. 'Go to Google and search for cute cats'"
                value={prompt}
                onChangeText={setPrompt}
                multiline
            />
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: theme === 'red' ? '#ff003c' : '#00d2ff',
                        shadowColor: theme === 'red' ? '#ff003c' : '#00d2ff',
                    }
                ]}
                onPress={handleSend}>
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
        borderTopColor: '#222',
        backgroundColor: '#0a0a0a',
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
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 6,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
    }
});
