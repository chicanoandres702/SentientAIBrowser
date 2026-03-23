// Feature: UI | Why: Status bar styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass } from './ui.primitives';

export const statusStyles = StyleSheet.create({
  statusBar: {
    height: 28,
    backgroundColor: BASE.panelGlass,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: BASE.borderSubtle,
    ...Platform.select({
      web: { ...webGlass(12), zIndex: 100 } as any,
    }),
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: {
    width: 6, height: 6, borderRadius: 3, marginRight: 8,
  },
  statusText: {
    color: BASE.textMuted,
    fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
  },
});
