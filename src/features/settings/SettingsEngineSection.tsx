// Feature: Settings Engine Section | Trace: src/features/settings/SettingsEngineSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { ConfigRow } from '../../components/settings/ConfigRow';
export const SettingsEngineSection = ({ isAIMode, setIsAIMode, useProxy, setUseProxy, useConfirmerAgent, setUseConfirmerAgent, isScholarMode, setIsScholarMode, accent, scholarAccent, colors }) => (
  <>
    <Text style={[{ color: colors.textMuted }]}>CORE ENGINE</Text>
    <View style={[{ borderColor: colors.border, backgroundColor: colors.bgElevated }]}> 
      <ConfigRow label="Sentient AI Mode" sub="Enable autonomous navigation" value={isAIMode} onToggle={setIsAIMode} accent={accent} />
      <ConfigRow label="CORS Proxy" sub="Bypass security restrictions" value={useProxy} onToggle={setUseProxy} accent={accent} />
      <ConfigRow label="Visual Confirmer" sub="Screenshot verify + auto-solve captcha" value={useConfirmerAgent} onToggle={setUseConfirmerAgent} accent={accent} />
      <ConfigRow label="Scholar Mode" sub="MISSION: SCHOLAR (Capella.edu)" value={isScholarMode} onToggle={setIsScholarMode} accent={scholarAccent} />
    </View>
  </>
);
