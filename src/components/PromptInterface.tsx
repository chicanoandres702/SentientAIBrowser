// Feature: UI | Why: AI prompt input — uses extracted styles + theme tokens
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated } from 'react-native';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';
import { styles } from './PromptInterface.styles';

interface Props {
    onExecutePrompt: (prompt: string) => void;
    theme: AppTheme;
}

export const PromptInterface: React.FC<Props> = React.memo(({ onExecutePrompt, theme }) => {
    const [prompt, setPrompt] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const colors = uiColors(theme);
    const accent = colors.accent;

    const handleSend = () => {
        if (prompt.trim()) {
            onExecutePrompt(prompt);
            setPrompt('');
        }
    };

    return (
        <View style={[styles.container, { borderTopColor: accent + '18' }]}>
            <View style={[styles.inputWrap, isFocused && { borderColor: accent, boxShadow: `0 0 10px ${accent}33` }]}>
                <Text style={[styles.promptGlyph, { color: accent }]}>›_</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Direct the AI..."
                    placeholderTextColor={colors.textMuted}
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
