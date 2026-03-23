// Feature: Tasks | Trace: workflow-panel.component.tsx
import React, { RefObject } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { WorkflowTaskRow } from '../../../components/tasks/WorkflowTaskRow';
import type { TaskItem } from '@features/tasks';
import { wp } from '../../../components/tasks/WorkflowPanel.styles';

interface Props {
  taskList: TaskItem[];
  accent: string;
  removeTask: (id: string) => void;
  yOffsets: RefObject<Record<string, number>>;
  activeTaskId?: string;
}

export const WorkflowTaskListSection: React.FC<Props> = ({
  taskList,
  accent,
  removeTask,
  yOffsets,
  activeTaskId,
}) => {
  const tasksToRender = Array.isArray(taskList) ? taskList : [];
  return tasksToRender.length > 0 ? (
    <>
      <Text style={wp.sectionLabel}>TASKS</Text>
      {(Array.isArray(taskList) ? taskList : []).map((task) => (
        <View key={task.id} onLayout={e => { yOffsets.current && (yOffsets.current[task.id] = e.nativeEvent.layout.y); }}>
          <WorkflowTaskRow item={task} accentColor={accent} removeTask={removeTask} />
        </View>
      ))}
    </>
  ) : null;
};
