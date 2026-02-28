// Feature: Tasks | Why: TaskFilterBar styles extracted with tokenized primitives
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
