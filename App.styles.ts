import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: Platform.OS === 'web' ? '100vh' as any : '100%',
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: Platform.OS === 'web' ? 20 : 50,
        ...Platform.select({
            web: { backdropFilter: 'blur(20px)', zIndex: 100 } as any,
        })
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        textShadowColor: 'rgba(255, 255, 255, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginBottom: 0,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        padding: 5,
        marginLeft: 10,
    },
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },
    contentArea: {
        flex: 1,
        flexDirection: 'column',
    },
    sidebar: {
        width: 380,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(8, 8, 8, 0.98)',
        display: 'flex',
        flexDirection: 'column',
        ...Platform.select({
            web: { boxShadow: '-5px 0 20px rgba(0,0,0,0.5)', zIndex: 50 } as any,
        })
    },
    sidebarContent: {
        flex: 1,
    },
    mobileSidebarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        backgroundColor: '#080808', // Solid for mobile to match standalone look
        zIndex: 100,
        padding: 5,
    },
    closeSidebarButton: {
        padding: 15,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    statusBar: {
        height: 34,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)', zIndex: 100 } as any,
        })
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    statusText: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
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
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
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

// Cinematic Web Styles (Scrollbars)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: #ff003c; }
    * { scrollbar-width: thin; scrollbar-color: #333 #000; }
  `;
    document.head.appendChild(style);
}
