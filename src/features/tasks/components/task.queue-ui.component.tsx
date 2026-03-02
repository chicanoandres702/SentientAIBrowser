// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Task queue UI component
 * [Subtask] Named-export shim delegating to WorkflowPanel
 * [Upstream] TaskItem array + callbacks -> [Downstream] WorkflowPanel render
 * [Law Check] 38 lines | Passed 100-Line Law
 */

import React from 'react';
import type { TaskItem } from '@features/tasks/types';
import type { AppTheme } from '../../../../App';
import { WorkflowPanel } from '../../../components/WorkflowPanel';

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
  onActivateTask?: (id: string) => void;
  reorderMissions?: (ids: string[]) => void;
  proxyBaseUrl?: string;
  onCloseMission?: (missionId: string, tabId?: string) => void;
  activeTabId?: string;
}

export const TaskQueueUI: React.FC<Props> = React.memo(
  ({
    tasks,
    theme,
    addTask,
    removeTask,
    clearTasks,
    editTask,
    isPaused,
    onPause,
    onResume,
    proxyBaseUrl,
    onCloseMission,
    activeTabId,
  }) => (
    <WorkflowPanel
      tasks={tasks}
      theme={theme}
      addTask={addTask}
      removeTask={removeTask}
      clearTasks={clearTasks}
      editTask={editTask}
      isPaused={isPaused}
      onPause={onPause}
      onResume={onResume}
      proxyBaseUrl={proxyBaseUrl}
      onCloseMission={onCloseMission}
      activeTabId={activeTabId}
    />
  )
);

TaskQueueUI.displayName = 'TaskQueueUI';
