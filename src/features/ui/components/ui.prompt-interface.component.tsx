// Feature: UI | Source: PromptInterface.tsx
// Task: Migrate PromptInterface to feature module with extracted animation logic
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import { AppTheme } from '../../../../App';
import { uiColors } from '@features/ui/theme/ui.theme';
import { injectPromptKeyframes } from './ui.prompt-keyframes.utils';
import { usePromptDotAnimation } from './usePromptDotAnimation.hook';
import { styles } from './ui.prompt-interface.styles';

export interface Props {
    onExecutePrompt: (prompt: string) => void | Promise<void>;
    theme: AppTheme;
}

export const PromptInterface: React.FC<Props> = React.memo(({ onExecutePrompt, theme }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const dots = usePromptDotAnimation(isPlanning);
  const colors = uiColors(theme);
  const accent = colors.accent;

  injectPromptKeyframes();

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
      {isPlanning && (
        <View style={styles.planningRow}>
          <View style={[styles.planningDot, { backgroundColor: accent }]} />
          <Text style={[styles.planningText, { color: accent }]}>PLANNING MISSION{dots}</Text>
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
