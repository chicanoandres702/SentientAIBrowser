// Feature: Missions | Trace: src/features/missions/components/MissionOverview.tsx
import { StyleSheet } from 'react-native';

export const missionStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
    header: { padding: 24, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#111' },
    title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
    closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
    closeText: { color: '#fff', fontSize: 24 },
    content: { padding: 24 },
    section: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'bottom', marginBottom: 20 },
    sectionTitle: { color: '#2a2a2a', fontSize: 10, fontWeight: '900', letterSpacing: 3 },
    routineCard: { backgroundColor: '#090909', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#111' },
    routineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    routineName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
    routineStat: { color: '#555', fontSize: 10, fontWeight: '700' },
    routineGoal: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 16 },
    routineFooter: { flexDirection: 'row', gap: 12 },
    launchBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    launchText: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    routineMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    metaItem: { color: '#333', fontSize: 10, fontWeight: '800' },
});
