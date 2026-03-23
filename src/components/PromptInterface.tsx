// Feature: UI | Why: AI prompt input — shows planning spinner while waiting for /agent/plan response
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';
import { styles } from './PromptInterface.styles';

const DOTS = ['', '.', '..', '...'];

// Why: inject spin + pulse keyframes once — no global CSS file needed
if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const id = '__prompt-keyframes';
    if (!document.getElementById(id)) {
        const el = document.createElement('style');
        el.id = id;
        el.textContent = `
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        `;
        document.head.appendChild(el);
    }
}

interface Props {
    onExecutePrompt: (prompt: string) => void | Promise<void>;
    theme: AppTheme;
}

export const PromptInterface: React.FC<Props> = React.memo(({ onExecutePrompt, theme }) => {
    const [prompt, setPrompt] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);
    const [dotIdx, setDotIdx] = useState(0);
    const dotTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const colors = uiColors(theme);
    const accent = colors.accent;

    // Why: animate the dot ellipsis while planning is in flight
    useEffect(() => {
        if (isPlanning) {
            dotTimer.current = setInterval(() => setDotIdx(i => (i + 1) % DOTS.length), 420);
        } else {
            clearInterval(dotTimer.current);
            setDotIdx(0);
        }
        return () => clearInterval(dotTimer.current);
    }, [isPlanning]);

    const handleSend = async () => {
        const v = prompt.trim();
        if (!v || isPlanning) return;
        setPrompt('');
        setIsPlanning(true);
        try { await onExecutePrompt(v); }
        finally { setIsPlanning(false); }
    };

    return (
        <View style={[styles.container, { borderTopColor: accent + '18' }]}>
            {/* Planning status row */}
            {isPlanning && (
                <View style={styles.planningRow}>
                    <View style={[styles.planningDot, { backgroundColor: accent }]} />
                    <Text style={[styles.planningText, { color: accent }]}>
                        PLANNING MISSION{DOTS[dotIdx]}
                    </Text>
                </View>
            )}

            <View style={styles.inputRow}>
                <View style={[
                    styles.inputWrap,
                    isFocused && !isPlanning && { borderColor: accent, ...Platform.select({ web: { boxShadow: `0 0 10px ${accent}33` } as any, default: {} }) },
                    isPlanning && styles.inputWrapPlanning,
                ]}>
                    <Text style={[styles.promptGlyph, { color: isPlanning ? accent + '55' : accent }]}>›_</Text>
                    <TextInput
                        style={[styles.input, isPlanning && styles.inputDisabled]}
                        placeholder={isPlanning ? 'Planning…' : 'Direct the AI...'}
                        placeholderTextColor={isPlanning ? accent + '44' : colors.textMuted}
                        value={prompt}
                        onChangeText={setPrompt}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={handleSend}
                        editable={!isPlanning}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendBtn,
                        { backgroundColor: isPlanning ? accent + 'aa' : accent },
                        !isPlanning && Platform.select({ web: { boxShadow: `0 0 10px ${accent}` } as any, default: {} }),
                        isPlanning && styles.sendBtnPlanning,
                    ]}
                    onPress={handleSend}
                    disabled={isPlanning}
                >
                    <Text style={[styles.sendIcon, isPlanning && styles.sendIconSpin]}>
                        {isPlanning ? '⟳' : '⏎'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});
