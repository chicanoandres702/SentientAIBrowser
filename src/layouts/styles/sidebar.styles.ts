// Feature: Layout | Why: Sidebar styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webShadow } from '../../features/ui/theme/ui.primitives';

export const sidebarStyles = StyleSheet.create({
  sidebar: {
    width: 340, borderWidth: 0, borderLeftWidth: 1,
    backgroundColor: BASE.panelDim,
    flexDirection: 'column', position: 'relative', overflow: 'hidden',
    ...webShadow('-2px 0 12px rgba(0,0,0,0.25)'),
    ...Platform.select({ web: { zIndex: 50 } as any }),
  },
  sidebarLeft: {
    borderLeftWidth: 0, borderRightWidth: 1,
    ...webShadow('2px 0 12px rgba(0,0,0,0.25)'),
  },
  sidebarCompact: { width: 280 },
  sidebarFocus: { width: 300 },
  sidebarSplit: {
    width: '45%' as any, minWidth: 300, maxWidth: 560,
  },
  sidebarCockpit: { width: 400, minWidth: 340, maxWidth: 500 },
  sidebarDashboard: { width: 380 },
  sidebarAccent: {
    position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.5,
  },
  sidebarAccentLeft: { right: 0 },
  sidebarAccentRight: { left: 0 },
  bottomPanel: {
    height: '40%' as any, minHeight: 220, borderTopWidth: 1,
    backgroundColor: BASE.panel2,
    ...webShadow('0 -2px 12px rgba(0,0,0,0.3)'),
  },
  mobileSidebarHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: BASE.border,
  },
  mobileSidebarTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  mobileSidebarClose: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: BASE.controlBg,
  },
});
