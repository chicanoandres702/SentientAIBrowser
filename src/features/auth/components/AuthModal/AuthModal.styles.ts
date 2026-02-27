// Feature: Auth | Trace: src/features/auth/ai-manifest.md
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 500,
        ...Platform.select({ web: { backdropFilter: 'blur(30px)' } as any })
    },
    modalBg: {
        width: 380, maxWidth: '90%',
        backgroundColor: 'rgba(15, 15, 15, 0.8)',
        borderRadius: 20, padding: 30,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        ...Platform.select({
            web: { boxShadow: '0 20px 50px rgba(0,0,0,0.8)' } as any,
            default: { elevation: 10 }
        })
    },
    title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: 4, marginBottom: 8 },
    subtitle: { fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 2, marginBottom: 30 },
    input: {
        width: '100%', height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8, paddingHorizontal: 15,
        color: '#fff', marginBottom: 15,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
        fontSize: 14,
    },
    errorText: { color: '#ff4444', fontSize: 12, marginBottom: 15, textAlign: 'center' },
    submitBtn: { 
        width: '100%', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10,
        ...Platform.select({
            web: { boxShadow: '0 5px 15px rgba(255, 0, 60, 0.4)' } as any,
            default: { elevation: 6 }
        })
    },
    submitText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, width: '100%' },
    line: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    dividerText: { color: '#666', fontSize: 10, marginHorizontal: 10, fontWeight: '700' },
    googleBtn: { width: '100%', height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
    googleText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    toggleBtn: { marginTop: 20, padding: 10 },
    toggleText: { color: '#666', fontSize: 12 }
});
