// Feature: LLM | Trace: README.md
import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        width: 320,
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(160, 100, 255, 0.25)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    gradient: { flex: 1, padding: 16 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 6,
    },
    pulse: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#a064ff', marginRight: 10,
        ...Platform.select({ native: { shadowColor: '#a064ff', shadowOpacity: 1, shadowRadius: 6 } }),
    },
    headerText: {
        color: '#a064ff', fontSize: 10, fontWeight: '900', letterSpacing: 3,
        ...Platform.select({ native: { textShadowColor: 'rgba(160, 100, 255, 0.5)', textShadowRadius: 8 } }),
    },
    scroll: { flex: 1 },
    scrollContent: { paddingVertical: 4 },
    thoughtItem: {
        marginBottom: 16, paddingLeft: 12,
        borderLeftWidth: 1, borderLeftColor: 'rgba(160, 100, 255, 0.3)',
    },
    thoughtHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 4,
    },
    metrics: { flexDirection: 'row', alignItems: 'center' },
    memoryBadge: {
        backgroundColor: 'rgba(160, 100, 255, 0.2)',
        paddingHorizontal: 6, paddingVertical: 1,
        borderRadius: 4, marginRight: 8,
        borderWidth: 0.5, borderColor: 'rgba(160, 100, 255, 0.5)',
    },
    memoryText: { color: '#a064ff', fontSize: 7, fontWeight: 'bold', letterSpacing: 1 },
    ratingText: {
        color: 'rgba(255, 255, 255, 0.5)', fontSize: 8, fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    timestamp: { color: 'rgba(160, 100, 255, 0.4)', fontSize: 8, fontWeight: 'bold' },
    reasoning: {
        color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 16,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    action: { color: 'rgba(160, 100, 255, 0.6)', fontSize: 9, marginTop: 6, fontWeight: '900', letterSpacing: 1 },
    actionType: { color: '#fff' }
});
