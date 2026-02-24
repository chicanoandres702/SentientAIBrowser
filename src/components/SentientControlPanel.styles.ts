// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        ...Platform.select({
            web: { backdropFilter: 'blur(20px)' } as any,
            default: {}
        }),
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 15, 15, 0.9)',
        borderRadius: 36,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 8,
        ...Platform.select({
            web: { boxShadow: '0 8px 32px rgba(0,0,0,0.6)' } as any,
            default: { elevation: 8 }
        }),
    },
    sideBtn: { padding: 8 },
    sideIcon: { color: '#333', fontSize: 14 },
    mainBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    shockwave: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    mainBtnInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    mainBtnText: { fontSize: 16, fontWeight: '900' },
    sep: { width: 1, height: 20, backgroundColor: '#1a1a1a', marginHorizontal: 8 },
    stopBtn: { padding: 8 },
    stopIcon: { color: '#444', fontSize: 14 },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 12,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 4,
    },
    statusLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2.5 },
});
