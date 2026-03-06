// Feature: Tasks | Trace: src/components/tasks/TaskSubActions.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SubAction } from '../../features/tasks/types';
import { subStyles } from './TaskItemView.styles';

const SubActionIcon = ({ action }: { action: string }) => (
  <Text style={subStyles.actionIcon}>
    {{ click: '🖱', type: '⌨', wait: '⏳', navigate: '🧭', scan_dom: '🔍', verify: '✅', interact: '👆', done: '🏁' }[action] || '▸'}
  </Text>
);

export const TaskSubActions: React.FC<{ subActions: SubAction[] }> = ({ subActions }) => (
  <View style={subStyles.subActionsContainer}>
    {(Array.isArray(subActions) ? subActions : []).map((sa, idx) => {
      const saDone = sa.status === 'completed';
      return (
        <View key={idx} style={[subStyles.subActionRow, saDone && subStyles.subActionDoneRow]}>
          <SubActionIcon action={sa.action} />
          <Text style={[subStyles.subActionText, saDone && subStyles.subActionDone]} numberOfLines={1}>
            {sa.explanation}
          </Text>
          {saDone && <Text style={{ fontSize: 8, color: '#00ffaa', marginLeft: 4 }}>✓</Text>}
        </View>
      );
    })}
  </View>
);
