// Feature: Tasks | Why: Styles + helpers for TaskItemView sub-actions and mission display
import { StyleSheet } from 'react-native';
import { TaskStatus } from '../../features/tasks/types';

export const getElapsedTime = (startTime: number | undefined) => {
    if (!startTime) return null;
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
};

export const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
        case 'completed': return { text: '✓ DONE', color: '#00ffaa' };
        case 'failed': return { text: '✕ FAILED', color: '#ff4444' };
        case 'in_progress': return { text: '⚙ ACTIVE', color: '#00d2ff' };
        case 'blocked_on_user': return { text: '⚠ BLOCKED', color: '#ffcc00' };
        default: return { text: '○ PENDING', color: '#888' };
    }
};

export const taskItemLocalStyles = StyleSheet.create({
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
    badge: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    timeText: { fontSize: 10, fontWeight: '600' },
    progressContainer: { marginTop: 8 },
    // Why: strikethrough + fade makes completion immediately obvious without hiding content
    completedTitle: { textDecorationLine: 'line-through', color: 'rgba(0,255,170,0.35)' },
    completedCardOverlay: { backgroundColor: 'rgba(0,255,170,0.03)' },
});

export const subStyles = StyleSheet.create({
    missionCard: { borderWidth: 2, borderRadius: 14 },
    missionLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginBottom: 2 },
    expandHint: { fontSize: 9, fontWeight: '600' },
    subActionsContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    subActionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
    actionIcon: { fontSize: 10, width: 16 },
    subActionText: { fontSize: 9, color: 'rgba(255,255,255,0.45)', flex: 1 },
    // Why: completed sub-actions get greyed + struck through so in-progress ones stand out
    subActionDone: { textDecorationLine: 'line-through', color: 'rgba(0,255,170,0.3)' },
    subActionDoneRow: { opacity: 0.55 },
});
