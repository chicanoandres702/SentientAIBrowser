// Feature: Tasks | Why: Named-export shim keeps all existing lazy imports working while
// delegating all rendering to the new single-workflow WorkflowPanel component.
import React from 'react';
import { TaskItem } from '../features/tasks/types';
import { AppTheme } from '../../App';
import { WorkflowPanel } from './WorkflowPanel';

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

export const TaskQueueUI: React.FC<Props> = React.memo(({
    tasks, theme, addTask, removeTask, clearTasks, editTask,
    isPaused, onPause, onResume, proxyBaseUrl, onCloseMission, activeTabId,
}) => (
    <WorkflowPanel
        tasks={tasks} theme={theme}
        addTask={addTask} removeTask={removeTask} clearTasks={clearTasks} editTask={editTask}
        isPaused={isPaused} onPause={onPause} onResume={onResume}
        proxyBaseUrl={proxyBaseUrl} onCloseMission={onCloseMission}
        activeTabId={activeTabId}
    />
));

