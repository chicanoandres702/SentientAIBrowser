// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const overlayStyles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        top: 130,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    webViewWrapper: {
        flex: 1,
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
    },
    hazeLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99,
        pointerEvents: 'none',
    },
    glassBackground: {
        backgroundColor: 'rgba(15, 15, 15, 0.7)',
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' } as any,
            default: {}
        })
    },
    glowingShadow: {
        ...Platform.select({
            native: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15 },
        }),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        padding: 25,
        borderRadius: 15,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    modalText: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    modalButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
