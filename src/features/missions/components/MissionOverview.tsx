// Feature: Missions | Trace: src/layouts/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { auth } from '../../auth/firebase-config';
import { listenToMissions, MissionItem } from '../../../utils/browser-sync-service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../auth/firebase-config';
import { RoutineManager } from './RoutineManager';

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
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [view, setView] = useState<'missions' | 'routines'>('missions');

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsubscribe = listenToMissions(auth.currentUser.uid, (data) => {
            setMissions(data);
            setLoading(false);
            data.forEach(async (m) => {
                if (m.tabId && !previews[m.tabId]) {
                    const tabSnap = await getDoc(doc(db, 'browser_tabs', m.tabId));
                    if (tabSnap.exists() && tabSnap.data().screenshot) {
                        setPreviews(prev => ({ ...prev, [m.tabId]: tabSnap.data().screenshot }));
                    }
                }
            });
        });
        return () => unsubscribe();
    }, [auth.currentUser]);

    const activeColor = theme === 'red' ? '#ff003c' : '#0070f3';

    const renderItem = ({ item }: { item: MissionItem }) => (
        <TouchableOpacity 
            style={[styles.card, { borderColor: activeColor + '44' }]} 
            onPress={() => {
                onSelectMission(item.tabId);
                onClose();
            }}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.goal} numberOfLines={1}>{item.goal}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? activeColor : '#333' }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.previewContainer}>
                {previews[item.tabId] ? (
                    <Image source={{ uri: previews[item.tabId] }} style={styles.previewImage} />
                ) : (
                    <View style={styles.placeholderPreview}>
                        <ActivityIndicator color={activeColor} />
                    </View>
                )}
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.progressText}>Progress: {item.progress}%</Text>
                <Text style={styles.actionText} numberOfLines={1}>{item.lastAction}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Mission Control</Text>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity onPress={() => setView('missions')} style={[styles.tab, view === 'missions' && { borderBottomColor: activeColor }]}>
                            <Text style={[styles.tabText, view === 'missions' && { color: activeColor }]}>Active</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setView('routines')} style={[styles.tab, view === 'routines' && { borderBottomColor: activeColor }]}>
                            <Text style={[styles.tabText, view === 'routines' && { color: activeColor }]}>Routines</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={{ color: '#fff', fontSize: 24 }}>×</Text>
                </TouchableOpacity>
            </View>

            {view === 'missions' ? (
                loading ? (
                    <ActivityIndicator color={activeColor} size="large" style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        data={missions}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        contentContainerStyle={styles.list}
                    />
                )
            ) : (
                <RoutineManager 
                    theme={theme} 
                    onLaunchRoutine={(r) => {
                        onLaunchRoutine(r.initialUrl, r.steps[0]);
                        onClose();
                    }}
                    currentGoal={currentGoal}
                    currentUrl={currentUrl}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { 
        padding: 20, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    tabContainer: { flexDirection: 'row', marginTop: 10 },
    tab: { paddingVertical: 5, paddingHorizontal: 15, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 10 },
    tabText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
    closeButton: { padding: 5 },
    list: { padding: 10 },
    card: { 
        flex: 1, 
        margin: 5, 
        backgroundColor: '#111', 
        borderRadius: 12, 
        borderWidth: 1, 
        overflow: 'hidden' 
    },
    cardHeader: { padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goal: { color: '#fff', fontSize: 12, fontWeight: 'bold', flex: 1 },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
    previewContainer: { height: 100, backgroundColor: '#050505' },
    previewImage: { width: '100%', height: '100%' },
    placeholderPreview: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    cardFooter: { padding: 10 },
    progressText: { color: '#aaa', fontSize: 10 },
    actionText: { color: '#666', fontSize: 9, marginTop: 2 }
});
