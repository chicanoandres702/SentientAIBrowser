// Feature: UI | Trace: src/components/HeadlessWebView.tsx
import { StyleSheet } from 'react-native';

export const headlessStyles = StyleSheet.create({
    visibleContainer: { flex: 1, backgroundColor: '#050505' },
    hiddenContainer: { height: 0, width: 0, opacity: 0, display: 'none' },
});

export const iframeStyles = {
    flex: 1, width: '100%', height: '100%',
    border: 'none', backgroundColor: '#000', minHeight: '100%',
};
