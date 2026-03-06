// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Workflow panel component
 * [Subtask] Main task queue display with mission tracking
 * [Upstream] TaskItem array -> [Downstream] Rendered task workflow
 * [Law Check] 77 lines | Passed 100-Line Law
 */

import React, { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';
import type { TaskItem } from '@features/tasks';
import type { AppTheme } from '../../../../App';
import { uiColors } from '@features/ui/theme/ui.theme';
import { TaskInputRow } from '@features/tasks';
import { wp } from '../../../components/tasks/WorkflowPanel.styles';
import { useWorkflowPanel } from '../../../components/tasks/workflow-panel.hook';
import { WorkflowPanelHeader } from './WorkflowPanelHeader';
import { WorkflowMissionSection } from './WorkflowMissionSection';
import { WorkflowTaskListSection } from './WorkflowTaskListSection';
import { WorkflowEmptyState } from './WorkflowEmptyState';
import { WorkflowSaveRoutineModal } from './WorkflowSaveRoutineModal';

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
      <WorkflowPanelHeader
        accent={accent}
        isActive={isActive}
        clearTasks={clearTasks}
        tasksLength={tasks.length}
      />
      <TaskInputRow onAddTask={addTask} accent={accent} />
      <WorkflowMissionSection
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
        setSaveModal={setSaveModal}
        taskList={taskList}
      />
      <WorkflowTaskListSection
        taskList={taskList}
        accent={accent}
        removeTask={removeTask}
        yOffsets={yOffsets}
        activeTaskId={activeTaskId}
      />
      {taskList.length === 0 && <WorkflowEmptyState />}
      <WorkflowSaveRoutineModal
        saveModal={saveModal}
        setSaveModal={setSaveModal}
        proxyBaseUrl={proxyBaseUrl}
        accent={accent}
      />
    </ScrollView>
  );
};
