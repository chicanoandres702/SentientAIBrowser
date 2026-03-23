// Feature: UI | Why: Single re-export facade — actual styles live in src/features/ui/theme/
import { layoutStyles } from './src/features/ui/theme/layout.styles';
import { overlayStyles } from './src/features/ui/theme/overlay.styles';
import { statusStyles } from './src/features/ui/theme/status.styles';
import { injectWebGlobalStyles } from './src/features/ui/theme/web-globals.service';

export const styles = {
    ...layoutStyles,
    ...overlayStyles,
    ...statusStyles,
};

// Inject scrollbar + selection styles on web
injectWebGlobalStyles();
