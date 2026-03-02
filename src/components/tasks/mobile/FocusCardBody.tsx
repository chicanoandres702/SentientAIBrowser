// Feature: Tasks | Why: Focus card body — scrollable task details with sub-actions, separated for 100-line law
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SubAction } from '../../../features/tasks/types';
import { TaskProgressBar } from '@features/tasks';
import { m } from './mobile-task.styles';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { focusExtraStyles as sx } from './MobileFocusLayout.extra.styles';

interface StatusCfg { icon: string; label: string; color: string }

interface Props {
    title: string;
    status: string;
    progress?: number;
    details?: string;
    startTime?: number;
    completedTime?: number;
    subActions?: SubAction[];
    accent: string;
    cfg: StatusCfg;
}

/** Inner content of the full-screen focus card — status badge, title, timing, sub-actions */
export const FocusCardBody: React.FC<Props> = ({
    title, status, progress, details, startTime, completedTime, subActions, accent, cfg,
}) => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Status badge */}
        <View style={[sx.statusBadge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '44' }]}>
            <Text style={{ fontSize: 14 }}>{cfg.icon}</Text>
            <Text style={[sx.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Title */}
        <Text style={sx.cardTitle}>{title.toUpperCase()}</Text>

        {/* Progress */}
        {status === 'in_progress' && progress !== undefined && (
            <View style={{ marginTop: 16 }}>
                <TaskProgressBar progress={progress} accentColor={accent} showPercentage height={4} />
            </View>
        )}

        {/* Details */}
        {details && <Text style={[m.body, { marginTop: 12 }]}>{details}</Text>}

        {/* Timing */}
        {startTime && (
            <View style={sx.timingRow}>
                <Text style={[m.mono, { color: accent }]}>⏱</Text>
                <Text style={m.body}>
                    Started {new Date(startTime).toLocaleTimeString()}
                    {completedTime && ` • Done ${new Date(completedTime).toLocaleTimeString()}`}
                </Text>
            </View>
        )}

        {/* Sub-actions (always visible in focus mode) */}
        {subActions && subActions.length > 0 && (
            <View style={sx.subSection}>
                <Text style={[m.caption, { color: accent, marginBottom: 8 }]}>SUB-ACTIONS</Text>
                {subActions.map((sa: SubAction, idx: number) => (
                    <View key={idx} style={sx.subRow}>
                        <View style={[sx.subDot, {
                            backgroundColor: sa.status === 'completed' ? BASE.success
                                : sa.status === 'in_progress' ? accent : BASE.textFaint
                        }]} />
                        <Text style={[m.body, { flex: 1 }]}>{sa.explanation}</Text>
                    </View>
                ))}
            </View>
        )}
    </ScrollView>
);
