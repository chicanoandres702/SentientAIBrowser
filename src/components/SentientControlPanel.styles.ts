// Feature: UI | Why: Control panel styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webInteractive, webShadow } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: BASE.panelGlassLight,
    borderTopWidth: 1,
    borderTopColor: BASE.borderSubtle,
    alignItems: 'center',
    ...webGlass(20),
    ...webShadow('0 -1px 8px rgba(0,0,0,0.2)'),
  },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BASE.panelDim,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: BASE.borderMed, gap: 6,
    ...webShadow('0 4px 20px rgba(0,0,0,0.4)'),
    ...Platform.select({
      web: { transition: 'all 200ms ease' } as any,
      default: { elevation: 8 },
    }),
  },
  sideBtn: { padding: 8, borderRadius: 8, ...webInteractive },
  sideIcon: { color: BASE.textFaint, fontSize: 14, fontWeight: '600' },
  mainBtn: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 12,
    marginHorizontal: 8, overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 200ms ease' } as any,
    }),
  },
  shockwave: { position: 'absolute', width: 48, height: 48, borderRadius: 14 },
  mainBtnInner: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', zIndex: 1,
  },
  mainBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  sep: {
    width: 1, height: 20,
    backgroundColor: BASE.border, marginHorizontal: 8,
  },
  stopBtn: { padding: 8, borderRadius: 8, ...webInteractive },
  stopIcon: { color: BASE.textFaint, fontSize: 14, fontWeight: '600' },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, marginLeft: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 4,
  },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginLeft: 6 },
});
