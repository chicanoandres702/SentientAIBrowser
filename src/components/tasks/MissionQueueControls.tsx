// Feature: Tasks | Why: Per-mission play/pause/stop/save controls surfaced on each card
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    missionId: string;
    /** True when this mission has at least one in_progress child task */
    isActive: boolean;
    isPaused: boolean;
    onPlay: () => void;
    onPause: () => void;
    /** Stop execution + prompt to save as routine */
    onStop: () => void;
    /** Open save-routine modal directly, without stopping */
    onSave: () => void;
    accentColor: string;
}

export const MissionQueueControls: React.FC<Props> = ({
    isActive, isPaused, onPlay, onPause, onStop, onSave, accentColor,
}) => {
    const running = isActive && !isPaused;

    return (
        <View style={s.row}>
            {/* Play / Pause toggle */}
            <TouchableOpacity
                onPress={running ? onPause : onPlay}
                style={[s.btn, { borderColor: accentColor + '55' }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Text style={[s.icon, { color: accentColor }]}>{running ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            {/* Stop — pauses and opens save prompt */}
            <TouchableOpacity
                onPress={onStop}
                style={[s.btn, { borderColor: 'rgba(255,60,60,0.35)' }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Text style={[s.icon, { color: 'rgba(255,90,90,0.85)' }]}>⏹</Text>
            </TouchableOpacity>

            {/* Save routine without stopping */}
            <TouchableOpacity
                onPress={onSave}
                style={[s.btn, { borderColor: 'rgba(255,255,255,0.12)' }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Text style={[s.icon, { color: 'rgba(255,255,255,0.45)' }]}>💾</Text>
            </TouchableOpacity>

            {running && (
                <View style={[s.badge, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
                    <Text style={[s.badgeText, { color: accentColor }]}>RUNNING</Text>
                </View>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 2 },
    btn: { borderWidth: 1, borderRadius: 6, width: 28, height: 24, justifyContent: 'center', alignItems: 'center' },
    icon: { fontSize: 11 },
    badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
});
