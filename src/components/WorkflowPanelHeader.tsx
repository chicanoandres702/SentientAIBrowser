// Feature: Tasks | Trace: src/components/WorkflowPanelHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { wp } from './tasks/WorkflowPanel.styles';

interface Props {
  accent: string;
  isActive: boolean;
  hasTasks: boolean;
  clearTasks: () => void;
}

export const WorkflowPanelHeader: React.FC<Props> = ({ accent, isActive, hasTasks, clearTasks }) => (
  <View style={wp.headerRow}>
    <View>
      <Text style={[wp.headerTitle, { color: accent }]}>TASKS</Text>
      <Text style={wp.headerSub}>{isActive ? 'WORKFLOW ACTIVE' : 'STANDBY'}</Text>
    </View>
    {hasTasks && (
      <TouchableOpacity onPress={clearTasks} style={wp.purgeBtn}>
        <Text style={wp.purgeText}>PURGE</Text>
      </TouchableOpacity>
    )}
  </View>
);
