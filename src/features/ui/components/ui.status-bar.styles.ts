// Feature: UI | Source: SentientStatusBar.styles.ts
// Task: Migrate status bar styles to feature module
import { StyleSheet } from 'react-native';
import { BASE, webGlass } from '@features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  bar: {
    height: 28,
    backgroundColor: BASE.panelGlass,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    ...webGlass(12),
  },
  seeker: {
    position: 'absolute', top: -1, width: 30, height: 1,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 3,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 5, height: 5, borderRadius: 2.5, marginRight: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  modeTag: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  divider: {
    width: 1, height: 8,
    backgroundColor: BASE.borderMed, marginHorizontal: 10,
  },
  msg: {
    fontSize: 8, fontWeight: '700', letterSpacing: 1.0,
    textShadowOffset: { width: 0, height: 0 },
  },
  right: { flexDirection: 'row', alignItems: 'center' },
  telemetry: { flexDirection: 'row', marginRight: 12, alignItems: 'center', gap: 2 },
  telLabel: { color: BASE.textFaint, fontSize: 7, fontWeight: '700' },
  telValue: { fontSize: 7, fontWeight: '800' },
  telSep: { color: BASE.textFaint, fontSize: 7 },
  proxy: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
});
