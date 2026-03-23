// Feature: Settings Layout Section | Trace: src/features/settings/SettingsLayoutSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LayoutSelector } from '../../components/settings/LayoutSelector';
export const SettingsLayoutSection = ({ layoutMode, setLayoutMode, accent, colors }) => (
  <>
    <Text style={[{ color: colors.textMuted }]}>WORKSPACE LAYOUT</Text>
    <View style={[{ borderColor: colors.border, backgroundColor: colors.bgElevated }]}> 
      <Text style={[{ color: colors.textMuted }]}>Choose a layout optimized for your workflow. All layouts adapt to both desktop and mobile.</Text>
      <LayoutSelector current={layoutMode} onSelect={setLayoutMode} accent={accent} />
    </View>
  </>
);
