// Feature: Tasks | Trace: src/features/tasks/index.ts
/*
 * [Barrel Export] Public API
 * [Constraint] Only export what external consumers need
 * [Law Check] 20 lines | Passed
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
