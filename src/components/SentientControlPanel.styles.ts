// Feature: UI | Why: Control panel styles — tokenized via ui.primitives
/*
 * [Parent Feature/Milestone] Control Panel UI
 * [Child Task/Issue] Persistent docked HUD — collapsible control panel
 * [Subtask] Styles for collapsed (status strip) + expanded (full pill)
 * [Law Check] 72 lines | Passed 100-Line Law
 */
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webInteractive, webShadow } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    paddingVertical: 6, paddingHorizontal: 12,
    backgroundColor: BASE.panelGlassLight,
    borderTopWidth: 1,
    borderTopColor: BASE.borderMed,
    alignItems: 'center',
    ...webGlass(20),
    ...webShadow('0 -2px 8px rgba(0,0,0,0.25)'),
  },
  /* Collapsed: compact single-line status strip */
  collapsedRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  collapsedLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  collapsedLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  collapsedMode: { fontSize: 9, fontWeight: '600', color: BASE.textFaint, letterSpacing: 1 },
  expandBtn: { padding: 4, ...webInteractive },
  expandIcon: { color: BASE.textFaint, fontSize: 12 },
  /* Expanded: full pill of controls */
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BASE.panelDim,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: BASE.borderMed, gap: 4,
    ...webShadow('0 4px 20px rgba(0,0,0,0.4)'),
    ...Platform.select({
      web: { transition: 'all 200ms ease' } as any,
      default: { elevation: 8 },
    }),
  },
  collapseBtn: { padding: 6, ...webInteractive },
  collapseIcon: { color: BASE.textFaint, fontSize: 10 },
  sideBtn: { padding: 7, borderRadius: 7, ...webInteractive },
  sideIcon: { color: BASE.textFaint, fontSize: 13, fontWeight: '600' },
  mainBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 6, overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 200ms ease' } as any,
    }),
  },
  shockwave: { position: 'absolute', width: 44, height: 44, borderRadius: 12 },
  mainBtnInner: {
    width: 34, height: 34, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  mainBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  sep: { width: 1, height: 18, backgroundColor: BASE.border, marginHorizontal: 6 },
  stopBtn: { padding: 7, borderRadius: 7, ...webInteractive },
  stopIcon: { color: BASE.textFaint, fontSize: 13, fontWeight: '600' },
  statusDot: {
    width: 7, height: 7, borderRadius: 4, marginLeft: 8,
    ...Platform.select({
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
    }),
  },
  statusLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginLeft: 5 },
});
