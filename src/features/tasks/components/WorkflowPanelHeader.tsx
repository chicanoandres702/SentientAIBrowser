// Feature: Tasks | Trace: workflow-panel.component.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { wp } from '../../../components/tasks/WorkflowPanel.styles';

interface Props {
  accent: string;
  isActive: boolean;
  clearTasks: () => void;
  tasksLength: number;
}

export const WorkflowPanelHeader: React.FC<Props> = ({ accent, isActive, clearTasks, tasksLength }) => (
  <View style={wp.headerRow}>
    <View>
      <Text style={[wp.headerTitle, { color: accent }]}>TASKS</Text>
      <Text style={wp.headerSub}>{isActive ? 'WORKFLOW ACTIVE' : 'STANDBY'}</Text>
    </View>
    {tasksLength > 0 && (
      <TouchableOpacity onPress={clearTasks} style={wp.purgeBtn}>
        <Text style={wp.purgeText}>PURGE</Text>
      </TouchableOpacity>
    )}
  </View>
);
