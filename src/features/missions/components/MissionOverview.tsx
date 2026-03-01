// Feature: Missions | Why: Mission overview panel — lists active missions and routines
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../../auth/firebase-config';
import { listenToMissions, MissionItem } from '../../../utils/browser-sync-service';
import { doc, onSnapshot } from 'firebase/firestore';
import { RoutineManager } from './RoutineManager';
import { missionStyles as styles } from './MissionOverview.styles';
import { uiColors } from '../../ui/theme/ui.theme';
import { MissionCard } from './MissionCard';

interface Props {
    theme: 'red' | 'blue';
    onSelectMission: (tabId: string) => void;
    onLaunchRoutine: (url: string, goal: string) => void;
    onClose: () => void;
    currentGoal?: string;
    currentUrl?: string;
}

export const MissionOverview: React.FC<Props> = ({ theme, onSelectMission, onLaunchRoutine, onClose, currentGoal, currentUrl }) => {
    const [missions, setMissions] = useState<MissionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'missions' | 'routines'>('missions');
    const [missionTasks, setMissionTasks] = useState<Record<string, any>>({});
    const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
    const activeColor = uiColors(theme).accent;

    useEffect(() => {
        if (!auth.currentUser) return;
        const taskUnsubs: (() => void)[] = [];
        const missionUnsub = listenToMissions(auth.currentUser.uid, (data) => {
            setMissions(data); setLoading(false);
            // Why: subscribe real-time to each mission's tasks so status updates (in_progress,
            // completed, failed) stream in live without requiring a manual refresh.
            taskUnsubs.forEach(u => u());
            taskUnsubs.length = 0;
            data.forEach((m) => {
                if (!m.id) return;
                const unsub = onSnapshot(doc(db, 'missions', m.id), (snap) => {
                    if (snap.exists() && snap.data().tasks) {
                        setMissionTasks(t => ({ ...t, [m.id]: snap.data().tasks }));
                    }
                });
                taskUnsubs.push(unsub);
            });
        });
        return () => { missionUnsub(); taskUnsubs.forEach(u => u()); };
    }, [auth.currentUser]);

    const renderItem = ({ item }: { item: MissionItem }) => (
        <MissionCard
            item={item}
            tasks={missionTasks[item.id] || []}
            isExpanded={expandedMissionId === item.id}
            onToggleExpand={() => setExpandedMissionId(expandedMissionId === item.id ? null : item.id)}
            onSelect={() => { onSelectMission(item.tabId); onClose(); }}
            activeColor={activeColor}
        />
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Mission Control</Text>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity onPress={() => setView('missions')} style={[styles.tab, view === 'missions' && { borderBottomColor: activeColor }]}><Text style={[styles.tabText, view === 'missions' && { color: activeColor }]}>Active</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => setView('routines')} style={[styles.tab, view === 'routines' && { borderBottomColor: activeColor }]}><Text style={[styles.tabText, view === 'routines' && { color: activeColor }]}>Routines</Text></TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}><Text style={{ color: '#fff', fontSize: 24 }}>×</Text></TouchableOpacity>
            </View>
            {view === 'missions'
                : (loading ? <ActivityIndicator color={activeColor} size="large" style={{ flex: 1 }} /> : <FlatList data={missions} renderItem={renderItem} keyExtractor={m => m.id} numColumns={2} contentContainerStyle={styles.list} extraData={missionTasks} />)
                : (<RoutineManager theme={theme} onLaunchRoutine={(r) => { onLaunchRoutine(r.initialUrl, r.steps[0]); onClose(); }} currentGoal={currentGoal} currentUrl={currentUrl} />)
            }
        </View>
    );
};
