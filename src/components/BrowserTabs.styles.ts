// Feature: UI | Why: Tab bar styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webInteractive, webShadow } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: BASE.panel2,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderSubtle,
    zIndex: 5,
  },
  scrollContent: { paddingHorizontal: 8, alignItems: 'flex-end', gap: 2 },
  tab: {
    height: 32, minWidth: 120, maxWidth: 200,
    backgroundColor: 'rgba(140, 160, 200, 0.04)',
    borderTopLeftRadius: 10, borderTopRightRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: BASE.borderSubtle,
    borderBottomWidth: 0,
    ...webInteractive,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 21, 32, 0.98)',
    borderColor: BASE.borderStrong,
    borderBottomWidth: 0,
    height: 34,
    ...webShadow('0 -1px 8px rgba(0,0,0,0.25)'),
    ...Platform.select({ default: { elevation: 3 } }),
  },
  activeIndicator: {
    position: 'absolute', top: 0, left: 8, right: 8,
    height: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2,
  },
  tabText: {
    color: BASE.textMuted,
    fontSize: 10, fontWeight: '600', letterSpacing: 0.5, flex: 1,
  },
  closeBtn: {
    padding: 4, marginLeft: 8, borderRadius: 4, opacity: 0.5,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'opacity 150ms' } as any,
      default: {},
    }),
  },
  closeIcon: { color: BASE.textMuted, fontSize: 12, fontWeight: '400' },
  newTabBtn: {
    height: 28, width: 28,
    backgroundColor: BASE.controlBg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
    borderColor: BASE.border,
    alignSelf: 'center',
    ...webInteractive,
  },
  newTabIcon: {
    color: BASE.textMuted, fontSize: 16, fontWeight: '300', marginTop: -1,
  },
});
