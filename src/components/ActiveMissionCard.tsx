// Feature: Tasks | Trace: src/components/WorkflowPanel.tsx
// Extract: Mission workflow card (reduces parent from 149 → ~80 lines)

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TaskItem } from '../features/tasks';
import { MissionQueueControls } from './tasks/MissionQueueControls';
import { wp } from './tasks/WorkflowPanel.styles';

interface Props {
    mission: TaskItem;
    completedCount: number;
    total: number;
    isActive: boolean;
    isPaused?: boolean;
    accent: string;
    barColor: string;
    onCloseMission?: (missionId: string, tabId?: string) => void;
    onPause?: () => void;
    onResume?: () => void;
    onSave?: () => void;
    /** Trigger AI replanner to assess current page and extend the plan */
    onExtendPlan?: () => void;
}

export const ActiveMissionCard: React.FC<Props> = ({
    mission, completedCount, total, isActive, isPaused, accent, barColor,
    onCloseMission, onPause, onResume, onSave, onExtendPlan,
}) => {
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const handleStop = useCallback(() => {
        onPause?.();
        onSave?.();
    }, [onPause, onSave]);

    return (
        <View style={[wp.wfCard, { borderColor: accent + '33', backgroundColor: accent + '08' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                    <Text style={[wp.wfLabel, { color: accent }]}>⚡ ACTIVE WORKFLOW</Text>
                    <Text style={wp.wfTitle}>{mission.title}</Text>
                </View>
                {onCloseMission && (
                    <TouchableOpacity
                        onPress={() => onCloseMission(mission.id, mission.tabId)}
                        style={[wp.purgeBtn, { borderColor: accent + '44', marginLeft: 8 }]}
                    >
                        <Text style={[wp.purgeText, { color: accent }]}>✕ END</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={wp.wfProgressRow}>
                <View style={wp.wfTrack}>
                    <View style={[wp.wfBar, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                </View>
                <Text style={[wp.wfPct, { color: barColor }]}>{pct === 100 ? '✓' : `${pct}%`}</Text>
            </View>
            <Text style={wp.wfStats}>{completedCount} / {total} tasks done</Text>
            <MissionQueueControls
                missionId={mission.id}
                isActive={isActive}
                isPaused={!!isPaused}
                onPlay={() => onResume?.()}
                onPause={() => onPause?.()}
                onStop={handleStop}
                onSave={onSave || (() => {})}
                onExtendPlan={onExtendPlan}
                accentColor={accent}
            />
        </View>
    );
};
