// Feature: UI | Why: WebView container styles — tokenized via ui.primitives
import { StyleSheet } from 'react-native';
import { BASE } from '../ui/theme/ui.primitives';

export const headlessStyles = StyleSheet.create({
  visibleContainer: { flex: 1, backgroundColor: BASE.bg },
  hiddenContainer: { height: 0, width: 0, opacity: 0, display: 'none' },
});

export const iframeStyles = {
  flex: 1, width: '100%', height: '100%',
  border: 'none', backgroundColor: '#000', minHeight: '100%',
};
