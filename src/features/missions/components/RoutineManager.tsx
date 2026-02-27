// Feature: Missions | Trace: src/features/missions/components/MissionOverview.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { auth } from '../../auth/firebase-config';
import { listenToRoutines, syncRoutineToFirestore, RoutineItem } from '../../../utils/browser-sync-service';

interface Props {
    theme: 'red' | 'blue';
    onLaunchRoutine: (routine: RoutineItem) => void;
    currentGoal?: string;
    currentUrl?: string;
}

export const RoutineManager: React.FC<Props> = ({ theme, onLaunchRoutine, currentGoal, currentUrl }) => {
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsubscribe = listenToRoutines(auth.currentUser.uid, (data) => {
            setRoutines(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth.currentUser]);

    const activeColor = theme === 'red' ? '#ff003c' : '#0070f3';

    const handleSaveCurrentAsRoutine = async () => {
        if (!auth.currentUser || !currentGoal || !newName) return;
        setSaving(true);
        try {
            const routine: RoutineItem = {
                id: Math.random().toString(36).substr(2, 9),
                userId: auth.currentUser.uid,
                name: newName,
                description: `Routine for: ${currentGoal}`,
                initialUrl: currentUrl || 'https://www.google.com',
                steps: [currentGoal],
                createdAt: Date.now()
            };
            await syncRoutineToFirestore(routine);
            setNewName('');
        } catch (e) {
            console.error("Failed to save routine", e);
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }: { item: RoutineItem }) => (
        <TouchableOpacity 
            style={[styles.routineCard, { borderColor: activeColor + '44' }]} 
            onPress={() => onLaunchRoutine(item)}
        >
            <Text style={styles.routineName}>{item.name}</Text>
            <Text style={styles.routineDesc} numberOfLines={1}>{item.description}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Saved Routines</Text>
            
            {currentGoal && (
                <View style={styles.saveContainer}>
                    <TextInput
                        style={[styles.input, { borderColor: activeColor + '88' }]}
                        placeholder="Name this routine..."
                        placeholderTextColor="#666"
                        value={newName}
                        onChangeText={setNewName}
                    />
                    <TouchableOpacity 
                        style={[styles.saveButton, { backgroundColor: activeColor }]} 
                        onPress={handleSaveCurrentAsRoutine}
                        disabled={saving || !newName}
                    >
                        {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveButtonText}>Save Current</Text>}
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator color={activeColor} />
            ) : (
                <FlatList
                    data={routines}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    style={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { padding: 20 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    saveContainer: { flexDirection: 'row', marginBottom: 20 },
    input: { 
        flex: 1, 
        backgroundColor: '#111', 
        color: '#fff', 
        padding: 10, 
        borderRadius: 8, 
        borderWidth: 1, 
        marginRight: 10 
    },
    saveButton: { paddingHorizontal: 15, justifyContent: 'center', borderRadius: 8 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    list: { marginTop: 10 },
    routineCard: { 
        backgroundColor: '#151515', 
        padding: 15, 
        borderRadius: 10, 
        borderWidth: 1, 
        marginBottom: 10 
    },
    routineName: { color: '#fff', fontSize: 14, fontWeight: '600' },
    routineDesc: { color: '#aaa', fontSize: 11, marginTop: 4 },
});
