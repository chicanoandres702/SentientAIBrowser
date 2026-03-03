// Feature: Layout | Why: Sidebar styles — tokenized via ui.primitives
/*
 * [Parent Feature/Milestone] Control Panel UI — Tabbed Command Drawer
 * [Law Check] 72 lines | Passed 100-Line Law
 */
import { StyleSheet, Platform } from 'react-native';
import { BASE, webShadow, webInteractive } from '../../features/ui/theme/ui.primitives';

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
  sidebarSplit: { width: '45%' as any, minWidth: 300, maxWidth: 560 },
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
  /* ── Tab Bar ── */
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: BASE.borderMed,
    backgroundColor: BASE.panelGlass,
  },
  tab: {
    flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 5,
    ...webInteractive,
  },
  tabActive: { borderBottomWidth: 2 },
  tabIcon: { fontSize: 12 },
  tabLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: BASE.textFaint },
  tabLabelActive: { fontWeight: '800' },
  tabContent: { flex: 1 },
  /* ── Intel panel ── */
  intelPanel: { flex: 1, padding: 12, gap: 10 },
  intelTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: BASE.textFaint, marginBottom: 4 },
  intelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BASE.borderSubtle,
  },
  intelKey: { fontSize: 10, fontWeight: '600', color: BASE.textMuted },
  intelVal: { fontSize: 10, fontWeight: '800', color: BASE.text },
  /* ── Mobile drawer ── */
  mobileSidebarHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BASE.border,
  },
  mobileSidebarTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  mobileSidebarClose: {
    width: 30, height: 30, borderRadius: 7, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: BASE.controlBg,
  },
});
