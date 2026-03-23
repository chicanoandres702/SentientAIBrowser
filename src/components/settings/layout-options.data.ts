// Feature: UI | Why: Layout options data — shared between inline switcher + settings
import { LayoutMode } from '../../hooks/useBrowserState';

export interface LayoutOption {
  mode: LayoutMode;
  icon: string;
  label: string;
  desktopDesc: string;
  mobileDesc: string;
}

export const LAYOUTS: LayoutOption[] = [
  { mode: 'standard', icon: '◫', label: 'Standard', desktopDesc: 'Side panel with browser', mobileDesc: 'Bottom sheet panel' },
  { mode: 'compact', icon: '▬', label: 'Compact', desktopDesc: 'Narrow sidebar, max content', mobileDesc: 'Slim header, full content' },
  { mode: 'focus', icon: '▣', label: 'Focus', desktopDesc: 'Hidden tabs, clean view', mobileDesc: 'Fullscreen browser' },
  { mode: 'split', icon: '◧', label: 'Split', desktopDesc: '50/50 browser & workflow', mobileDesc: 'Stacked panels' },
  { mode: 'cockpit', icon: '⌬', label: 'Cockpit', desktopDesc: 'Left command bay', mobileDesc: 'Bottom command drawer' },
  { mode: 'stack', icon: '☰', label: 'Stack', desktopDesc: 'Preview over mission rail', mobileDesc: 'Scrollable stack' },
  { mode: 'dashboard', icon: '⊞', label: 'Dashboard', desktopDesc: 'Grid-based workspace', mobileDesc: 'Swipeable card panels' },
  { mode: 'zen', icon: '◉', label: 'Zen', desktopDesc: 'Distraction-free browsing', mobileDesc: 'Full immersion mode' },
];
