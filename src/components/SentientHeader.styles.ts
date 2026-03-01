// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    headerContainer: {
        height: Platform.OS === 'ios' ? 95 : 70,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    brand: { flexDirection: 'row', alignItems: 'center' },
    orbStack: {
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    brandOrbOuter: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        ...Platform.select({
            web: { boxShadow: '0 0 10px rgba(255,255,255,0.8)' } as any,
            default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 }
        })
    },
    brandOrbInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        ...Platform.select({
            web: { boxShadow: '0 0 4px rgba(255,255,255,1)' } as any,
            default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 }
        })
    },
    brandText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 6,
        ...Platform.select({
            web: { textShadow: '0 0 12px rgba(255,255,255,0.5)' } as any,
            default: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 }
        })
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: { color: '#888', fontSize: 18, lineHeight: 24 },
});
