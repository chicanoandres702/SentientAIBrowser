// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const statusStyles = StyleSheet.create({
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
    }
});
