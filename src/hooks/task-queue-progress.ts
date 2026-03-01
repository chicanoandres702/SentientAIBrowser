// Feature: Tasks | Trace: README.md
import { TaskItem, TaskStatus } from '../features/tasks/types';

export const recalcMissionProgress = (allTasks: TaskItem[], missionId: string): TaskItem[] => {
    const children = allTasks.filter(t => t.missionId === missionId && !t.isMission);
    if (children.length === 0) return allTasks;

    const completed = children.filter(t => t.status === 'completed').length;
    const inProgress = children.filter(t => t.status === 'in_progress').length;
    const failed = children.filter(t => t.status === 'failed').length;
    const total = children.length;
    const progress = Math.min(100, Math.round(((completed + inProgress * 0.5) / total) * 100));

    let missionStatus: TaskStatus = 'in_progress';
    if (completed === total) missionStatus = 'completed';
    else if (failed === total) missionStatus = 'failed';
    else if (completed + failed === total) missionStatus = failed > 0 ? 'failed' : 'completed';

    return allTasks.map(t => {
        if (t.id !== missionId || !t.isMission) return t;
        return {
            ...t,
            progress,
            status: missionStatus,
            completedTime: missionStatus === 'completed' ? Date.now() : t.completedTime,
        };
    });
};
