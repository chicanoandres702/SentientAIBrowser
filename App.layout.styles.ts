// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

import { statusStyles } from './App.status.styles';

export const layoutStyles = {
    ...StyleSheet.create({
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
            ...Platform.select({
                native: { textShadowColor: 'rgba(255, 255, 255, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
            }),
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
            backgroundColor: '#080808',
            zIndex: 100,
            padding: 5,
        },
        closeSidebarButton: {
            padding: 15,
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: '#333',
        }
    }),
    ...statusStyles
};
