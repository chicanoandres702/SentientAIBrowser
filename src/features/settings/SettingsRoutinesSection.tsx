// Feature: Settings Routines Section | Trace: src/features/settings/SettingsRoutinesSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { RoutinePicker } from '../routines';
export const SettingsRoutinesSection = ({ routines, routinesLoading, onRunRoutine, theme, colors }) => (
  routines !== undefined ? (
    <>
      <Text style={[{ color: colors.textMuted }]}>SAVED WORKFLOWS</Text>
      <View style={[{ borderColor: colors.border, backgroundColor: colors.bgElevated }]}> 
        <RoutinePicker routines={routines} loading={routinesLoading ?? false} onRun={onRunRoutine ?? (() => {})} theme={theme} maxHeight={260} />
      </View>
    </>
  ) : null
);
