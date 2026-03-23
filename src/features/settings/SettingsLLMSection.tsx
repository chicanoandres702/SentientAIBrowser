// Feature: Settings LLM Section | Trace: src/features/settings/SettingsLLMSection.tsx
import React from 'react';
import { View, Text, TextInput } from 'react-native';
export const SettingsLLMSection = ({ runtimeGeminiApiKey, setRuntimeGeminiApiKey, colors }) => (
  <>
    <Text style={[{ color: colors.textMuted }]}>LLM OVERRIDE</Text>
    <View style={[{ borderColor: colors.border, backgroundColor: colors.bgElevated }]}> 
      <Text style={[{ color: colors.textMuted }]}>Optional runtime Gemini API key override (stored locally in this browser).</Text>
      <TextInput
        value={runtimeGeminiApiKey}
        onChangeText={setRuntimeGeminiApiKey}
        placeholder="AIza..."
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        style={[{ color: colors.text, borderColor: colors.border, backgroundColor: colors.panel2 }]}
      />
    </View>
  </>
);
