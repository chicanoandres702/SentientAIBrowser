// Feature: Tasks | Why: Task queue styles tokenized via ui.primitives
import { StyleSheet } from 'react-native';
import { BASE } from '../../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BASE.bgDeep, padding: 14 },
    absoluteGradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    header: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
    subHeader: { fontSize: 8, color: BASE.textMuted, marginTop: 2, letterSpacing: 0.8, fontWeight: 'bold' },
    purgeBtn: { borderWidth: 1, borderColor: BASE.borderFocus, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    clearText: { fontSize: 9, color: BASE.textMuted, fontWeight: 'bold', letterSpacing: 0.6 },
    taskInputWrapper: { flexDirection: 'row', backgroundColor: BASE.inputBg, borderRadius: 12, borderWidth: 1, borderColor: BASE.borderFocusStrong, marginBottom: 14, overflow: 'hidden' },
    taskInput: { flex: 1, height: 42, paddingHorizontal: 12, color: BASE.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
    addBtn: { width: 50, justifyContent: 'center', alignItems: 'center' },
    addBtnText: { fontSize: 24, color: BASE.bg, fontWeight: '300' },
    taskCard: { flexDirection: 'row', backgroundColor: BASE.inputBg, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: BASE.borderFocusStrong, overflow: 'hidden' },
    statusVertical: { width: 4 },
    cardInfo: { flex: 1, padding: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    taskTitle: { fontSize: 11, color: BASE.text, fontWeight: '800', letterSpacing: 0.4 },
    taskDetails: { fontSize: 9, color: BASE.textMuted, marginTop: 4, lineHeight: 12 },
    editInput: { color: BASE.text, fontSize: 11, fontWeight: '800', padding: 8, backgroundColor: 'rgba(138, 156, 188, 0.12)', borderRadius: 6 },
    cardAction: { paddingHorizontal: 10, justifyContent: 'center' },
    closeIcon: { fontSize: 24, fontWeight: '200' },
    emptyText: { textAlign: 'center', marginTop: 14, fontSize: 12, fontWeight: '500' },
});
