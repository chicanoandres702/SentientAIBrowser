// Feature: Routines | Trace: src/features/missions/components/RoutineManager.tsx
import { StyleSheet } from 'react-native';

export const routineStyles = StyleSheet.create({
    container: { padding: 20 },
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    saveContainer: { flexDirection: 'row', marginBottom: 20 },
    input: { flex: 1, backgroundColor: '#111', color: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, marginRight: 10 },
    saveButton: { paddingHorizontal: 15, justifyContent: 'center', borderRadius: 8 },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    list: { marginTop: 10 },
    routineCard: { backgroundColor: '#151515', padding: 15, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
    routineName: { color: '#fff', fontSize: 14, fontWeight: '600' },
    routineDesc: { color: '#aaa', fontSize: 11, marginTop: 4 },
});
