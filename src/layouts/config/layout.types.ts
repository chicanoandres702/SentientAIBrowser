// Feature: Layout | Why: Single source of truth for layout type definitions
import { LayoutMode } from '../../hooks/useBrowserState';

/** Describes which UI elements are visible for a given layout mode */
export interface LayoutConfig {
    showTabs: boolean;
    showChrome: boolean;
    showStatusBar: boolean;
    showControlPanel: boolean;
    showSidebar: boolean;
    sidebarPlacement: 'left' | 'right' | 'bottom' | 'none';
    sidebarWidth: number | string;
    contentDirection: 'row' | 'column';
    showNeuralMonologue: boolean;
}

/** Width presets for sidebar rendering */
export type SidebarWidthMode =
    | 'standard'
    | 'compact'
    | 'focus'
    | 'split'
    | 'cockpit'
    | 'dashboard';

/** Device-responsive config pair for each layout mode */
export type ResponsiveLayoutConfig = {
    desktop: LayoutConfig;
    mobile: LayoutConfig;
};

/** Full map of all layout mode configurations */
export type LayoutConfigMap = Record<
    LayoutMode,
    ResponsiveLayoutConfig
>;
