// Feature: Tasks | Trace: src/components/WorkflowPanelEmpty.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { wp } from './tasks/WorkflowPanel.styles';

export const WorkflowPanelEmpty: React.FC = () => (
  <View style={wp.emptyWrap}>
    <Text style={wp.emptyIcon}>⚡</Text>
    <Text style={wp.emptyText}>No tasks yet — add one above</Text>
  </View>
);
