import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 10, fontWeight: 'bold', letterSpacing: 2 },
    header: { padding: 20, marginBottom: 10 },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    subtitle: { fontSize: 10, color: 'rgba(255, 255, 255, 0.3)', fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    item: { padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    weight: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    timestamp: { fontSize: 10, color: 'rgba(255, 255, 255, 0.2)' },
    question: { fontSize: 12, marginBottom: 6, fontStyle: 'italic' },
    answer: { fontSize: 15, fontWeight: '600' },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.2)', fontSize: 14, textAlign: 'center' }
});
