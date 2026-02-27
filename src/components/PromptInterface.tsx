// Feature: UI | Trace: README.md
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { AppTheme } from '../../App';

interface Props {
    onExecutePrompt: (prompt: string) => void;
    theme: AppTheme;
}

export const PromptInterface: React.FC<Props> = React.memo(({ onExecutePrompt, theme }) => {
    const [prompt, setPrompt] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const accent = theme === 'red' ? '#ff003c' : '#00d2ff';

    const handleSend = () => {
        if (prompt.trim()) {
            onExecutePrompt(prompt);
            setPrompt('');
        }
    };

    return (
        <View style={[styles.container, { borderTopColor: accent + '18' }]}>
            <View style={[styles.inputWrap, isFocused && { borderColor: accent, boxShadow: `0 0 12px ${accent}33` }]}>
                <Text style={[styles.promptGlyph, { color: accent }]}>›_</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Direct the AI..."
                    placeholderTextColor="#2a2a2a"
                    value={prompt}
                    onChangeText={setPrompt}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onSubmitEditing={handleSend}
                    multiline
                />
            </View>
            <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }]}
                onPress={handleSend}
            >
                <Text style={styles.sendIcon}>⏎</Text>
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#000',
        borderTopWidth: 1,
        gap: 10,
    },
    inputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#080808',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#111',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    promptGlyph: { fontSize: 14, fontWeight: '900', marginRight: 10, opacity: 0.7 },
    input: { flex: 1, color: '#ccc', fontSize: 13, maxHeight: 80 },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});
