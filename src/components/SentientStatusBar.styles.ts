// Feature: UI | Trace: README.md
// Why: shadow* and textShadow* props inside StyleSheet.create fire at module
// load on web. Wrapped in Platform.select so they're native-only.
import { StyleSheet, Platform } from 'react-native';

const nativeShadowDot = Platform.select({
    web: { boxShadow: '0 0 4px rgba(255,255,255,0.8)' } as any,
    native: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
}) ?? {};

const nativeShadowSeeker = Platform.select({
    web: { boxShadow: '0 0 4px rgba(255,255,255,0.8)' } as any,
    native: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
}) ?? {};

const nativeTextShadow = Platform.select({
    web: { textShadow: '0 0 4px rgba(255,255,255,0.5)' } as any,
    native: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 },
}) ?? {};

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
        ...nativeShadowSeeker,
    },
    left: { flexDirection: 'row', alignItems: 'center' },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 10,
        ...nativeShadowDot,
    },
    modeTag: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
    divider: { width: 1, height: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginHorizontal: 12 },
    msg: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1.5, ...nativeTextShadow },
    right: { flexDirection: 'row', alignItems: 'center' },
    telemetry: { flexDirection: 'row', marginRight: 20, alignItems: 'center' },
    telLabel: { color: '#333', fontSize: 7, fontWeight: 'bold' },
    telValue: { fontSize: 7, fontWeight: '900' },
    telSep: { color: '#222', fontSize: 7 },
    proxy: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
});
