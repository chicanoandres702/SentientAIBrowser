// Feature: Layout | Why: Centralizes layout mode configs so MainLayout stays lean
import { LayoutMode } from '../../hooks/useBrowserState';
import { LayoutConfig, LayoutConfigMap } from './layout.types';

/** All layout mode configurations keyed by mode name */
const LAYOUT_CONFIGS: LayoutConfigMap = {
    standard: {
        desktop: { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'right', sidebarWidth: 340, contentDirection: 'row', showNeuralMonologue: true },
        mobile:  { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: true },
    },
    compact: {
        desktop: { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'right', sidebarWidth: 280, contentDirection: 'row', showNeuralMonologue: false },
        mobile:  { showTabs: false, showChrome: true, showStatusBar: false, showControlPanel: true, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: false },
    },
    focus: {
        desktop: { showTabs: false, showChrome: true, showStatusBar: false, showControlPanel: true, showSidebar: true, sidebarPlacement: 'right', sidebarWidth: 300, contentDirection: 'row', showNeuralMonologue: false },
        mobile:  { showTabs: false, showChrome: true, showStatusBar: false, showControlPanel: false, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: false },
    },
    split: {
        desktop: { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'right', sidebarWidth: '45%', contentDirection: 'row', showNeuralMonologue: true },
        mobile:  { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'bottom', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: true },
    },
    cockpit: {
        desktop: { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'left', sidebarWidth: 400, contentDirection: 'row', showNeuralMonologue: true },
        mobile:  { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: true },
    },
    stack: {
        desktop: { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'bottom', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: true },
        mobile:  { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: true, showSidebar: true, sidebarPlacement: 'bottom', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: true },
    },
    dashboard: {
        desktop: { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: false, showSidebar: true, sidebarPlacement: 'right', sidebarWidth: 380, contentDirection: 'row', showNeuralMonologue: true },
        mobile:  { showTabs: true, showChrome: true, showStatusBar: true, showControlPanel: false, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: '100%', contentDirection: 'column', showNeuralMonologue: true },
    },
    zen: {
        desktop: { showTabs: false, showChrome: false, showStatusBar: false, showControlPanel: false, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: 0, contentDirection: 'row', showNeuralMonologue: false },
        mobile:  { showTabs: false, showChrome: false, showStatusBar: false, showControlPanel: false, showSidebar: false, sidebarPlacement: 'none', sidebarWidth: 0, contentDirection: 'column', showNeuralMonologue: false },
    },
};

/**
 * Resolves the active LayoutConfig for the given mode + device + AI state.
 * When AI mode is off, sidebar/control-panel/monologue are always hidden.
 */
export const getLayoutConfig = (
    mode: LayoutMode,
    isDesktop: boolean,
    isAIMode: boolean,
): LayoutConfig => {
    const base = isDesktop
        ? LAYOUT_CONFIGS[mode].desktop
        : LAYOUT_CONFIGS[mode].mobile;

    if (!isAIMode) {
        return {
            ...base,
            showSidebar: false,
            showControlPanel: false,
            showNeuralMonologue: false,
        };
    }

    return base;
};
