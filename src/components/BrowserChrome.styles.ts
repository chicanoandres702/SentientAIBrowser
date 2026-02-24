// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        gap: 12,
        ...Platform.select({
            web: { backdropFilter: 'blur(15px)' } as any,
            default: { elevation: 5 }
        }),
        zIndex: 10,
    },
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navIcon: { color: '#888', fontSize: 22, fontWeight: '300', lineHeight: 26 },
    addressBar: {
        flex: 1,
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 21,
        borderWidth: 1,
        paddingHorizontal: 16,
        ...Platform.select({
            web: { boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' } as any,
        })
    },
    lockIcon: { fontSize: 13, marginRight: 10, opacity: 0.5 },
    urlInput: {
        flex: 1,
        height: '100%',
        color: '#eee',
        fontSize: 14,
        letterSpacing: 0.5,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
    },
    reloadBtn: { padding: 8 },
    reloadIcon: { fontSize: 18, fontWeight: '400' },
    goBtn: {
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 3,
    },
    goText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
});
