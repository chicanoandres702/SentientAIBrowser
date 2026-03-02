// Feature: Workflow | Trace: README.md
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] Workflow manager component
 * [Subtask] Displays saved workflows for selection
 * [Upstream] Workflow list -> [Downstream] Selection callback
 * [Law Check] 75 lines | Passed 100-Line Law
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { AppTheme } from '../../../App';

interface Props {
  onSelectWorkflow: (workflowName: string) => void;
  theme: AppTheme;
}

export const WorkflowManager: React.FC<Props> = ({ onSelectWorkflow, theme }) => {
  const savedWorkflows = [
    { id: '1', name: 'Swagbucks: Survey Sweeper', description: 'Background 24/7 survey hunter.' },
    { id: '2', name: 'Google: Login Template', description: 'Handles 2FA intervention.' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Workflows</Text>
      {savedWorkflows.map((wf) => (
        <TouchableOpacity
          key={wf.id}
          style={[
            styles.card,
            {
              borderColor: theme === 'red' ? 'rgba(255, 0, 60, 0.4)' : 'rgba(0, 210, 255, 0.4)',
              shadowColor: theme === 'red' ? '#ff003c' : '#00d2ff',
            },
          ]}
          onPress={() => onSelectWorkflow(wf.name)}
        >
          <Text style={[styles.title, { color: theme === 'red' ? '#ff406c' : '#40e0ff' }]}>{wf.name}</Text>
          <Text style={styles.description}>{wf.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

WorkflowManager.displayName = 'WorkflowManager';

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#eee',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 4,
  },
});
