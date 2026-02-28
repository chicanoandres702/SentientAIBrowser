// Feature: UI | Why: Global web styles injected once at startup for scrollbars + selection
import { Platform } from 'react-native';

/** Inject professional web globals (scrollbars, selection, smoothing) */
export function injectWebGlobalStyles(): void {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = `
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(140, 160, 200, 0.12); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(140, 160, 200, 0.25); }
        * { scrollbar-width: thin; scrollbar-color: rgba(140, 160, 200, 0.12) transparent; }
        ::selection { background: rgba(90, 168, 255, 0.25); }
        body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        input, textarea { font-family: inherit; }
        * { box-sizing: border-box; }
    `;
    document.head.appendChild(style);
}
