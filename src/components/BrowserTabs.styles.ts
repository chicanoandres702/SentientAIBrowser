// Feature: UI | Why: Pill-shaped tab bar — fluid, glassy, easy to tap
import { StyleSheet, Platform } from 'react-native';
import { BASE, webInteractive, webShadow } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    height: 46,
    backgroundColor: 'rgba(6, 8, 16, 0.97)',
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderSubtle,
    zIndex: 5,
    ...Platform.select({ web: { backdropFilter: 'blur(14px)' } as any, default: {} }),
  },
  scrollContent: { paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', gap: 5 },
  tab: {
    height: 30, minWidth: 90, maxWidth: 180,
    backgroundColor: 'rgba(140, 160, 200, 0.04)',
    borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, gap: 6,
    borderWidth: 1, borderColor: 'rgba(140, 160, 200, 0.07)',
    ...webInteractive,
    ...Platform.select({ web: { transition: 'all 180ms ease' } as any, default: {} }),
  },
  activeTab: {
    backgroundColor: 'rgba(140, 160, 200, 0.11)',
    borderColor: 'rgba(185, 205, 230, 0.20)',
    ...webShadow('0 0 16px rgba(0,210,255,0.07), inset 0 1px 0 rgba(255,255,255,0.04)'),
    ...Platform.select({ default: { elevation: 3 } }),
  },
  favicon: {
    width: 16, height: 16, borderRadius: 5,
    backgroundColor: 'rgba(140, 160, 200, 0.10)',
    justifyContent: 'center', alignItems: 'center',
  },
  faviconText: { fontSize: 8, fontWeight: '800', color: BASE.textMuted },
  tabText: { color: BASE.textMuted, fontSize: 11, fontWeight: '500', letterSpacing: 0.1, flex: 1 },
  activeTabText: { color: BASE.textDim, fontWeight: '700' },
  closeBtn: {
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer', transition: 'background-color 150ms' } as any, default: {} }),
  },
  closeIcon: { color: BASE.textFaint, fontSize: 9, fontWeight: '400' },
  overviewTab: {
    height: 30, paddingHorizontal: 13,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(140, 160, 200, 0.09)',
    backgroundColor: 'rgba(140, 160, 200, 0.05)',
    ...webInteractive,
    ...Platform.select({ web: { transition: 'all 180ms ease' } as any, default: {} }),
  },
  overviewActive: {
    borderColor: 'rgba(185, 205, 230, 0.24)',
    backgroundColor: 'rgba(140, 160, 200, 0.13)',
  },
  overviewIcon: { fontSize: 12 },
  overviewText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7, color: BASE.textMuted },
  divider: { width: 1, height: 18, backgroundColor: BASE.borderSubtle, marginHorizontal: 2 },
  newTabBtn: {
    height: 28, width: 28, backgroundColor: 'rgba(140, 160, 200, 0.04)',
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: BASE.borderSubtle, marginLeft: 2,
    ...webInteractive,
  },
  newTabIcon: { color: BASE.textMuted, fontSize: 15, fontWeight: '300' },
});

