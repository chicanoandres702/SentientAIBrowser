// Feature: Tasks | Why: Build mission nodes for embedded rendering
import { useMemo } from 'react';
import { TaskItem } from '../../features/tasks/types';
import { FilterType, SortMode, STATUS_ORDER } from './task-filter.utils';

export interface MissionNode {
    mission: TaskItem;
    children: TaskItem[];
    completedCount: number;
    totalCount: number;
}

export interface MissionNodeResult {
    missions: MissionNode[];
    orphans: TaskItem[];
}

export const useMissionNodes = (
    tasks: TaskItem[],
    filterType: FilterType,
    sortBy: SortMode,
): MissionNodeResult => useMemo(() => {
    const missions = tasks.filter(t => t.isMission);
    let children = tasks.filter(t => !t.isMission);
    if (filterType === 'active') children = children.filter(t => t.status === 'pending' || t.status === 'in_progress');
    else if (filterType === 'completed') children = children.filter(t => t.status === 'completed');
    else if (filterType === 'failed') children = children.filter(t => t.status === 'failed' || t.status === 'blocked_on_user');

    const sortedChildren = sortBy === 'status'
        ? [...children].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
        : [...children].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const byMission = new Map<string, TaskItem[]>();
    const orphans: TaskItem[] = [];
    for (const child of sortedChildren) {
        if (child.missionId) {
            const group = byMission.get(child.missionId) || [];
            group.push(child);
            byMission.set(child.missionId, group);
        } else {
            orphans.push(child);
        }
    }

    const sortedMissions = [...missions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const nodes = sortedMissions.map(m => {
        const allChildren = tasks.filter(t => !t.isMission && t.missionId === m.id);
        return {
            mission: m,
            children: byMission.get(m.id) || [],
            completedCount: allChildren.filter(t => t.status === 'completed').length,
            totalCount: allChildren.length,
        } as MissionNode;
    });

    return { missions: nodes, orphans };
}, [tasks, filterType, sortBy]);
