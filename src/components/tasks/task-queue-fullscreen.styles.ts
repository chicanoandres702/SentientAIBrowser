// Feature: Tasks UI | Trace: README.md
import { StyleSheet } from 'react-native';
import { BASE } from '../../features/ui/theme/ui.theme';

export const fsStyles = StyleSheet.create({
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999, backgroundColor: BASE.bg,
    },
    toggleBtn: {
        borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, marginRight: 8,
    },
    toggleText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.6 },
});
