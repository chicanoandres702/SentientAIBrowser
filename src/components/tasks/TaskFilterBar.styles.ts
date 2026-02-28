// Feature: Tasks | Why: Perf-optimized styles — cached dynamic helpers avoid per-render allocations
import { StyleSheet } from 'react-native';
import { BASE } from '../../features/ui/theme/ui.primitives';

export const filterBarStyles = StyleSheet.create({
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 10, paddingVertical: 8,
        gap: 5, flexWrap: 'wrap',
    },
    filterBtn: {
        paddingHorizontal: 8, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1,
        borderColor: BASE.borderFocusStrong,
    },
    filterText: {
        fontSize: 10, fontWeight: '700',
        color: BASE.textMuted, letterSpacing: 0.3,
    },
    sortRow: {
        flexDirection: 'row',
        paddingHorizontal: 10, paddingVertical: 6,
        justifyContent: 'flex-end',
    },
    sortBtn: {
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1,
        borderColor: BASE.borderFocus,
    },
    sortText: {
        fontSize: 9, fontWeight: '700', letterSpacing: 0.4,
    },
});

// Why: Cached style objects — same color returns same reference, skips RN bridge diffing
const _btnCache = new Map<string, { backgroundColor: string; borderColor: string }>();
const _txtCache = new Map<string, { color: string }>();

export const activeBtnStyle = (color: string) => {
    let s = _btnCache.get(color);
    if (!s) { s = { backgroundColor: color + '22', borderColor: color }; _btnCache.set(color, s); }
    return s;
};

export const activeTextStyle = (color: string) => {
    let s = _txtCache.get(color);
    if (!s) { s = { color }; _txtCache.set(color, s); }
    return s;
};
