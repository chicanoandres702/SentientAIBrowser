// Feature: UI | Why: Header styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webInteractive } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  headerContainer: {
    height: Platform.OS === 'ios' ? 92 : 52,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: BASE.border,
    ...webGlass(20),
  },
  content: {
    flex: 1, flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  orbStack: {
    width: 12, height: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  brandOrbOuter: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    ...Platform.select({
      web: { boxShadow: '0 0 8px rgba(0,0,0,0.7)' } as any,
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 },
    }),
  },
  brandOrbInner: {
    width: 5, height: 5, borderRadius: 2.5,
    ...Platform.select({
      web: { boxShadow: '0 0 4px rgba(0,0,0,1)' } as any,
      default: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4 },
    }),
  },
  brandText: {
    color: BASE.text, fontSize: 12, fontWeight: '800', letterSpacing: 2.5,
    ...Platform.select({
      web: { textShadow: '0 0 8px rgba(115,165,255,0.20)' } as any,
      default: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
    }),
  },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: BASE.controlBg,
    borderWidth: 1, borderColor: BASE.border,
    justifyContent: 'center', alignItems: 'center',
    ...webInteractive,
  },
  iconText: { color: BASE.textMuted, fontSize: 14, lineHeight: 18 },
});
