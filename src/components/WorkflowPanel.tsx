// Feature: Tasks | Trace: src/components/WorkflowPanel.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { TaskItem } from '../features/tasks';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';
import { useActiveMission, useFilteredTasks } from './tasks/task-filter.utils';
import { SaveRoutineModal } from './tasks/SaveRoutineModal';
import { WorkflowTaskRow } from './tasks/WorkflowTaskRow';
import { ActiveMissionCard } from './ActiveMissionCard';
import { TaskInputRow } from './TaskInputRow';
import { wp } from './tasks/WorkflowPanel.styles';

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
  tasks, theme, addTask, removeTask, clearTasks,
  isPaused = false, onPause, onResume, proxyBaseUrl = '', onCloseMission, activeTabId,
}) => {
  const colors = uiColors(theme);
  const accent = colors.accent;
  const [saveModal, setSaveModal] = useState<SaveModal>(null);
  const tabTasks = useMemo(
    () => activeTabId ? tasks.filter(t => t.tabId === activeTabId) : tasks,
    [tasks, activeTabId],
  );
  const mission = useActiveMission(tabTasks);
  const allTaskList = useFilteredTasks(tabTasks, 'all', 'time');
  const taskList = useMemo(
    () => mission ? allTaskList.filter(t => t.missionId === mission.id) : allTaskList,
    [allTaskList, mission],
  );
  const completedCount = taskList.filter(t => t.status === 'completed').length;
  const total = taskList.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isActive = tabTasks.some(t => t.status === 'in_progress');
  const barColor = pct === 100 ? '#00ffaa' : accent;
  return (
    <ScrollView contentContainerStyle={wp.scrollContent} showsVerticalScrollIndicator={false}>
            {/* ── Header ── */}
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
          {taskList.map(t => (
            <WorkflowTaskRow key={t.id} item={t} accentColor={accent} removeTask={removeTask} />
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
        <SaveRoutineModal visible goal={saveModal.goal} tasks={saveModal.tasks}
          proxyBaseUrl={proxyBaseUrl} accentColor={accent} onClose={() => setSaveModal(null)} />
      )}
    </ScrollView>
  );
};
