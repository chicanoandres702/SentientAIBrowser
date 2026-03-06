// Feature: Tasks | Trace: workflow-panel.component.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { wp } from '../../../components/tasks/WorkflowPanel.styles';

export const WorkflowEmptyState: React.FC = () => (
  <View style={wp.emptyWrap}>
    <Text style={wp.emptyIcon}>⚡</Text>
    <Text style={wp.emptyText}>No tasks yet — add one above</Text>
  </View>
);
