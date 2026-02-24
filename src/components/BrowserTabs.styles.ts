// Feature: UI | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        height: 48,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        zIndex: 5,
    },
    scrollContent: {
        paddingHorizontal: 15,
        alignItems: 'flex-end',
    },
    tab: {
        height: 38,
        minWidth: 140,
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomWidth: 0,
    },
    activeTab: {
        backgroundColor: 'rgba(15, 15, 15, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomWidth: 0,
        height: 42,
        ...Platform.select({
            web: { boxShadow: '0 -4px 15px rgba(0,0,0,0.5)' } as any,
            default: { elevation: 4 }
        }),
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    tabText: {
        color: '#666',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
    },
    closeBtn: {
        padding: 6,
        marginLeft: 10,
        opacity: 0.7,
    },
    closeIcon: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '300',
    },
    newTabBtn: {
        height: 38,
        width: 38,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center'
    },
    newTabIcon: {
        color: '#aaa',
        fontSize: 22,
        fontWeight: '300',
        marginTop: -3
    }
});
