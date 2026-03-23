// Feature: Analytics | Trace: README.md
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 20 },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    subtitle: { fontSize: 10, color: 'rgba(255, 255, 255, 0.3)', fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
    moduleCard: { padding: 20, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, marginBottom: 20 },
    moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    moduleTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
    statusText: { fontSize: 8, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
    statItem: { alignItems: 'center' },
    statVal: { fontSize: 16, fontWeight: '900' },
    statLabel: { fontSize: 8, color: '#666', marginTop: 4, fontWeight: 'bold' },
    actionBtn: { marginTop: 20, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 }
});
