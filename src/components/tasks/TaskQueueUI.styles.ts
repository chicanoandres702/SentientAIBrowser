import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 24 },
    absoluteGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    header: { fontSize: 14, fontWeight: '900', letterSpacing: 4 },
    subHeader: { fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: 1.5, fontWeight: 'bold' },
    purgeBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    clearText: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', letterSpacing: 1 },
    taskInputWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 30, overflow: 'hidden' },
    taskInput: { flex: 1, height: 50, paddingHorizontal: 20, color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
    addBtn: { width: 50, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { fontSize: 28, color: '#000', fontWeight: '300' },
    taskCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
    statusVertical: { width: 4 },
    cardInfo: { flex: 1, padding: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    taskTitle: { fontSize: 12, color: '#fff', fontWeight: '900', letterSpacing: 1 },
    taskDetails: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 8, lineHeight: 14 },
    editInput: { color: '#fff', fontSize: 12, fontWeight: '900', padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 },
    cardAction: { paddingHorizontal: 15, justifyContent: 'center' },
    closeIcon: { fontSize: 24, fontWeight: '200' }
});
