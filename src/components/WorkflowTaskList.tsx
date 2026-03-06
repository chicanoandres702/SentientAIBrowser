// Feature: Tasks | Trace: src/components/WorkflowTaskList.tsx
import React, { RefObject } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { TaskItem } from '../features/tasks';
import { wp } from './tasks/WorkflowPanel.styles';
import { WorkflowTaskRow } from './tasks/WorkflowTaskRow';

interface Props {
  taskList: TaskItem[];
  accent: string;
  removeTask: (id: string) => void;
  proxyBaseUrl?: string;
  yOffsets: RefObject<Record<string, number>>;
  taskOp: (taskId: string, op: 'retry' | 'skip' | 'block-user') => void;
}

export const WorkflowTaskList: React.FC<Props> = ({ taskList, accent, removeTask, proxyBaseUrl, yOffsets, taskOp }) => (
  <>
    <Text style={wp.sectionLabel}>TASKS</Text>
    {(Array.isArray(taskList) ? taskList : []).map((t) => (
      <View key={t.id} onLayout={e => { yOffsets.current[t.id] = e.nativeEvent.layout.y; }}>
        <WorkflowTaskRow
          item={t} accentColor={accent} removeTask={removeTask}
          onPlay={proxyBaseUrl ? (id) => taskOp(id, 'retry') : undefined}
          onRetry={proxyBaseUrl ? (id) => taskOp(id, 'retry') : undefined}
          onAllowMe={proxyBaseUrl ? (id) => taskOp(id, 'block-user') : undefined}
        />
      </View>
    ))}
  </>
);
