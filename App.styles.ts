// Feature: UI | Trace: README.md
import { Platform } from 'react-native';
import { layoutStyles } from './App.layout.styles';
import { overlayStyles } from './App.overlay.styles';

export const styles = {
    ...layoutStyles,
    ...overlayStyles
};

// Cinematic Web Styles (Scrollbars)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #000; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: #ff003c; }
    * { scrollbar-width: thin; scrollbar-color: #333 #000; }
  `;
    document.head.appendChild(style);
}
