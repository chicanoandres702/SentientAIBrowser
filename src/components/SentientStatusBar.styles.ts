// Feature: UI | Trace: README.md
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    bar: {
        height: 30,
        backgroundColor: 'rgba(5, 5, 5, 0.98)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    seeker: {
        position: 'absolute',
        top: -1,
        width: 40,
        height: 1,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    left: { flexDirection: 'row', alignItems: 'center' },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    modeTag: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
    divider: { width: 1, height: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginHorizontal: 12 },
    msg: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1.5, textShadowOffset: { width: 0, height: 0 } },
    right: { flexDirection: 'row', alignItems: 'center' },
    telemetry: { flexDirection: 'row', marginRight: 20, alignItems: 'center' },
    telLabel: { color: '#333', fontSize: 7, fontWeight: 'bold' },
    telValue: { fontSize: 7, fontWeight: '900' },
    telSep: { color: '#222', fontSize: 7 },
    proxy: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
});
