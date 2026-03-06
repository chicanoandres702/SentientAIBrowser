// Feature: Settings Daemon Section | Trace: src/features/settings/SettingsDaemonSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
export const SettingsDaemonSection = ({ isDaemonRunning, onToggleDaemon, accent, colors }) => (
  <>
    <Text style={[{ color: colors.textMuted }]}>DAEMON</Text>
    <TouchableOpacity style={[{ borderColor: isDaemonRunning ? colors.danger + '44' : accent + '33', backgroundColor: isDaemonRunning ? colors.dangerSoft : `${accent}0a` }]} onPress={onToggleDaemon}>
      <View style={[{ backgroundColor: isDaemonRunning ? colors.danger : accent }]} />
      <Text style={[{ color: isDaemonRunning ? colors.danger : accent }]}>{isDaemonRunning ? 'TERMINATE DAEMON' : 'LAUNCH DAEMON'}</Text>
    </TouchableOpacity>
  </>
);
