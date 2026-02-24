// Feature: UI | Trace: README.md
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    content: {
        backgroundColor: 'rgba(10, 10, 15, 0.95)',
        width: '100%', maxWidth: 400,
        padding: 24, borderRadius: 12,
        borderWidth: 1, overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    pulse: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
    title: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 3 },
    question: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 15, lineHeight: 22,
        marginBottom: 20, fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1, borderRadius: 6,
        padding: 12, fontSize: 14, marginBottom: 20,
    },
    buttonRow: { flexDirection: 'row', gap: 12 },
    btn: { flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
    cancelBtn: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    confirmText: { color: '#000', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
    cancelText: { color: 'rgba(255, 255, 255, 0.6)', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }
});
