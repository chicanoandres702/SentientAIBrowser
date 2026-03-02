// Feature: Tasks | Why: Hierarchical task tree grouping — groups tasks under parent missions for tree rendering
import { useMemo } from 'react';
import { TaskItem } from '../../features/tasks/types';
import type { FilterType, SortMode } from '../../hooks/useFilteredTasks';
import { STATUS_ORDER } from './task-filter.utils';

/** A mission node with its child tasks nested underneath */
export interface MissionNode {
    mission: TaskItem;
    children: TaskItem[];
    completedCount: number;
    totalCount: number;
}

/** Flat row for rendering in a list — either a mission header or an indented child task */
export type HierarchyRow =
    | { type: 'mission'; mission: TaskItem; completedCount: number; totalCount: number; isLast: boolean }
    | { type: 'task'; task: TaskItem; isFirst: boolean; isLast: boolean; siblingIndex: number; siblingCount: number; missionId: string };

/**
 * Groups tasks hierarchically under their parent missions.
 * Returns a flat list of HierarchyRows for easy FlatList rendering.
 * Orphan tasks (no missionId) get their own "ungrouped" section.
 */
export const useHierarchicalTasks = (
    tasks: TaskItem[],
    filterType: FilterType = 'all',
    sortBy: SortMode = 'time',
): HierarchyRow[] =>
    useMemo(() => {
        const missions = tasks.filter(t => t.isMission);
        let children = tasks.filter(t => !t.isMission);

        // Apply filter to children only
        if (filterType === 'active') children = children.filter(t => t.status === 'pending' || t.status === 'in_progress');
        else if (filterType === 'completed') children = children.filter(t => t.status === 'completed');
        else if (filterType === 'failed') children = children.filter(t => t.status === 'failed' || t.status === 'blocked_on_user');

        const sortedChildren = sortBy === 'status'
            ? [...children].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
            : [...children].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Group children by missionId
        const childrenByMission = new Map<string, TaskItem[]>();
        const orphans: TaskItem[] = [];
        for (const child of sortedChildren) {
            if (child.missionId) {
                const group = childrenByMission.get(child.missionId) || [];
                group.push(child);
                childrenByMission.set(child.missionId, group);
            } else {
                orphans.push(child);
            }
        }

        // Sort missions — active first, then by time
        const sortedMissions = [...missions].sort((a, b) => {
            const aActive = a.status === 'in_progress' ? 0 : 1;
            const bActive = b.status === 'in_progress' ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });

        const rows: HierarchyRow[] = [];
        for (let mi = 0; mi < sortedMissions.length; mi++) {
            const mission = sortedMissions[mi];
            const missionChildren = childrenByMission.get(mission.id) || [];
            const allChildrenUnfiltered = tasks.filter(t => !t.isMission && t.missionId === mission.id);
            const completedCount = allChildrenUnfiltered.filter(t => t.status === 'completed').length;
            const totalCount = allChildrenUnfiltered.length;

            rows.push({ type: 'mission', mission, completedCount, totalCount, isLast: mi === sortedMissions.length - 1 && orphans.length === 0 });

            for (let ci = 0; ci < missionChildren.length; ci++) {
                rows.push({ type: 'task', task: missionChildren[ci], isFirst: ci === 0, isLast: ci === missionChildren.length - 1, siblingIndex: ci, siblingCount: missionChildren.length, missionId: mission.id });
            }
        }

        for (let oi = 0; oi < orphans.length; oi++) {
            rows.push({ type: 'task', task: orphans[oi], isFirst: oi === 0, isLast: oi === orphans.length - 1, siblingIndex: oi, siblingCount: orphans.length, missionId: '' });
        }

        return rows;
    }, [tasks, filterType, sortBy]);
