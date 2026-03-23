// Feature: UI | Trace: ui.header.component.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { styles } from './ui.header.styles';

interface Props {
  isSidebarVisible: boolean;
  setIsSidebarVisible: (v: boolean) => void;
  setIsSettingsVisible: (v: boolean) => void;
  setIsIntelVisible: (v: boolean) => void;
  accent: string;
  colors: any;
}

export const HeaderActions: React.FC<Props> = ({
  isSidebarVisible,
  setIsSidebarVisible,
  setIsSettingsVisible,
  setIsIntelVisible,
  accent,
  colors,
}) => (
  <View style={styles.actions}>
    <TouchableOpacity
      style={[styles.iconBtn, isSidebarVisible && { ...styles.iconBtnActive, backgroundColor: `${accent}14`, borderColor: `${accent}44` }]}
      onPress={() => setIsSidebarVisible(!isSidebarVisible)}
    >
      <Text style={[styles.iconText, { color: isSidebarVisible ? accent : colors.textMuted }]}>◈</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.iconBtn} onPress={() => setIsIntelVisible(true)}>
      <Text style={styles.iconText}>📊</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSettingsVisible(true)}>
      <Text style={styles.iconText}>⚙</Text>
    </TouchableOpacity>
  </View>
);
