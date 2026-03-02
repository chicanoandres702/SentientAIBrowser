// Feature: Tasks | Trace: src/components/WorkflowPanel.tsx
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Workflow panel component
 * [Subtask] Main task queue display with mission tracking and routine saving
 * [Upstream] TaskItem array + callbacks -> [Downstream] Rendered task workflow
 * [Law Check] 77 lines | Passed 100-Line Law
 */

import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import type { TaskItem } from '../features/tasks';
import type { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';
import { SaveRoutineModal } from './tasks/SaveRoutineModal';
import { WorkflowTaskRow } from './tasks/WorkflowTaskRow';
import { ActiveMissionCard } from './ActiveMissionCard';
import { TaskInputRow } from '@features/tasks';
import { wp } from './tasks/WorkflowPanel.styles';
import { useWorkflowPanel } from './tasks/workflow-panel.hook';

interface Props {
  tasks: TaskItem[];
  theme: AppTheme;
  addTask: (t: string) => void;
  removeTask: (id: string) => void;
  clearTasks: () => void;
  editTask: (id: string, t: string) => void;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  proxyBaseUrl?: string;
  onCloseMission?: (missionId: string, tabId?: string) => void;
  activeTabId?: string;
}

type SaveModal = { goal: string; tasks: TaskItem[] } | null;

export const WorkflowPanel: React.FC<Props> = ({
  tasks,
  theme,
  addTask,
  removeTask,
  clearTasks,
  isPaused = false,
  onPause,
  onResume,
  proxyBaseUrl = '',
  onCloseMission,
  activeTabId,
}) => {
  const colors = uiColors(theme);
  const accent = colors.accent;
  const [saveModal, setSaveModal] = useState<SaveModal>(null);
  const { mission, taskList, completedCount, total, pct, isActive } = useWorkflowPanel(tasks, activeTabId);
  const barColor = pct === 100 ? '#00ffaa' : accent;
  const scrollRef = useRef<ScrollView>(null);
  const yOffsets = useRef<Record<string, number>>({});
  const activeTaskId = taskList.find(t => t.status === 'in_progress')?.id;
  // Why: scroll to the in_progress card whenever the active task advances
  useEffect(() => {
    if (activeTaskId !== undefined && yOffsets.current[activeTaskId] !== undefined) {
      scrollRef.current?.scrollTo({ y: yOffsets.current[activeTaskId], animated: true });
    }
  }, [activeTaskId]);

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={wp.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={wp.headerRow}>
        <View>
          <Text style={[wp.headerTitle, { color: accent }]}>TASKS</Text>
          <Text style={wp.headerSub}>{isActive ? 'WORKFLOW ACTIVE' : 'STANDBY'}</Text>
        </View>
        {tasks.length > 0 && (
          <TouchableOpacity onPress={clearTasks} style={wp.purgeBtn}>
            <Text style={wp.purgeText}>PURGE</Text>
          </TouchableOpacity>
        )}
      </View>
      <TaskInputRow onAddTask={addTask} accent={accent} />
      {mission && (
        <ActiveMissionCard
          mission={mission}
          completedCount={completedCount}
          total={total}
          isActive={isActive}
          isPaused={isPaused}
          accent={accent}
          barColor={barColor}
          onCloseMission={onCloseMission}
          onPause={onPause}
          onResume={onResume}
          onSave={() => setSaveModal({ goal: mission.title, tasks: taskList })}
        />
      )}
      {taskList.length > 0 && (
        <>
          <Text style={wp.sectionLabel}>TASKS</Text>
          {taskList.map((t) => (
            <View key={t.id} onLayout={e => { yOffsets.current[t.id] = e.nativeEvent.layout.y; }}>
              <WorkflowTaskRow item={t} accentColor={accent} removeTask={removeTask} />
            </View>
          ))}
        </>
      )}
      {taskList.length === 0 && (
        <View style={wp.emptyWrap}>
          <Text style={wp.emptyIcon}>⚡</Text>
          <Text style={wp.emptyText}>No tasks yet — add one above</Text>
        </View>
      )}
      {saveModal && (
        <SaveRoutineModal
          visible
          goal={saveModal.goal}
          tasks={saveModal.tasks}
          proxyBaseUrl={proxyBaseUrl}
          accentColor={accent}
          onClose={() => setSaveModal(null)}
        />
      )}
    </ScrollView>
  );
};
