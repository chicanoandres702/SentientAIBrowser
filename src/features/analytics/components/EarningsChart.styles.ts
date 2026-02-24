import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        padding: 20, backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12, margin: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    header: { marginBottom: 20 },
    title: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    subtitle: { fontSize: 8, color: 'rgba(255, 255, 255, 0.3)', fontWeight: 'bold', marginTop: 2, letterSpacing: 1 },
    chartArea: { width: '100%', justifyContent: 'flex-end' },
    barsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%', paddingHorizontal: 10, zIndex: 2 },
    barWrapper: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
    bar: { width: '100%', maxWidth: 12, borderRadius: 2, overflow: 'hidden' },
    gridLine: { position: 'absolute', left: 0, right: 0, borderBottomWidth: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    footerText: { fontSize: 10, fontWeight: 'bold', color: '#888', letterSpacing: 1 }
});
