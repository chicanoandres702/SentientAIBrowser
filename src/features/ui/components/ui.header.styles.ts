// Feature: UI | Source: SentientHeader.styles.ts — Command Bar redesign
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webInteractive, webShadow } from '@features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  headerContainer: {
    height: Platform.OS === 'ios' ? 88 : 44,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderMed,
    ...webGlass(20),
    ...webShadow('0 2px 8px rgba(0,0,0,0.35)'),
  },
  /* 3-zone row: brand | command-center | actions */
  content: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 10, gap: 6,
  },
  /* Left: orb + wordmark */
  brand: { flexDirection: 'row', alignItems: 'center', minWidth: 90 },
  orbStack: {
    width: 10, height: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  brandOrbOuter: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    ...Platform.select({
      web: { boxShadow: '0 0 8px rgba(0,0,0,0.7)' } as any,
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 },
    }),
  },
  brandOrbInner: {
    width: 4, height: 4, borderRadius: 2,
    ...Platform.select({
      web: { boxShadow: '0 0 4px rgba(0,0,0,1)' } as any,
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
    }),
  },
  brandText: {
    color: BASE.text, fontSize: 10, fontWeight: '800', letterSpacing: 2.5,
    ...Platform.select({
      web: { textShadow: '0 0 8px rgba(115,165,255,0.20)' } as any,
      default: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
    }),
  },
  /* Center: quick-action command strip + layout switcher */
  center: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  layoutCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  /* Quick-action chips */
  chip: {
    height: 26, paddingHorizontal: 8, borderRadius: 6,
    backgroundColor: BASE.controlBg,
    borderWidth: 1, borderColor: BASE.border,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    ...webInteractive,
  },
  chipActive: {
    borderWidth: 1,
  },
  chipText: { color: BASE.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  chipTextActive: { fontWeight: '800' },
  chipIcon: { fontSize: 11 },
  /* AI status LED */
  led: {
    width: 7, height: 7, borderRadius: 4,
    ...Platform.select({
      web: {} as any,
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6 },
    }),
  },
  /* Right: icon action buttons */
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 84 },
  iconBtn: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: BASE.controlBg,
    borderWidth: 1, borderColor: BASE.border,
    justifyContent: 'center', alignItems: 'center',
    ...webInteractive,
  },
  iconBtnActive: { borderWidth: 1 },
  iconText: { color: BASE.textMuted, fontSize: 13, lineHeight: 16 },
  /* Zone separator accent line */
  zoneSep: {
    width: 1, height: 18, backgroundColor: BASE.borderMed, marginHorizontal: 2,
  },
});
