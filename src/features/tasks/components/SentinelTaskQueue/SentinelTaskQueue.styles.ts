import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.05)', backgroundColor: '#050505' },
    header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
    headerText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 3, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
    listContent: { padding: 15 },
    emptyText: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 12, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
    taskItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
    taskMain: { flexDirection: 'row', alignItems: 'center' },
    statusCol: { width: 30, alignItems: 'center' },
    infoCol: { flex: 1, marginLeft: 10 },
    taskTitle: { color: '#eee', fontSize: 13, fontWeight: 'bold' },
    taskTime: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 10, marginTop: 2 },
    taskDetails: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 11, marginTop: 8, lineHeight: 16, paddingLeft: 40 },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    actionBtnText: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 }
});
