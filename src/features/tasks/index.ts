// Feature: Tasks | Trace: src/features/tasks/index.ts
/*
 * [Barrel Export] Public API
 * [Constraint] Only export what external consumers need
 * [Law Check] 28 lines | Passed
 */

// Types
export type { TaskItem, MissionTask, TaskStatus, TaskFilter, SubAction } from './tasks.types';

// Pure utilities
export {
    getCurrentTaskForMission,
    filterTasks,
    getTaskStats,
    updateTaskStatus,
    sortByStatus,
    groupByMission,
} from './tasks.utils';

// Services (Firestore sync)
export { syncTaskToFirestore, updateTaskStatusInFirestore, listenToTasks, getCurrentMissionTasks } from './tasks.service';

// UI Components
export { TaskInputRow } from './components/task.input-row.component';
export { TaskQueueUI } from './components/task.queue-ui.component';
export { TaskProgressBar } from './components/task.progress-bar.component';
export { WorkflowPanel } from './components/workflow-panel.component';
