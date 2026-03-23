// Feature: Settings Appearance Section | Trace: src/features/settings/SettingsAppearanceSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { ThemeSelector } from '../../components/settings/ThemeSelector';
export const SettingsAppearanceSection = ({ theme, setTheme, colors }) => (
  <>
    <Text style={[{ color: colors.textMuted }]}>APPEARANCE</Text>
    <View style={[{ borderColor: colors.border, backgroundColor: colors.bgElevated }]}> 
      <ThemeSelector current={theme} onSelect={setTheme} />
    </View>
  </>
);
