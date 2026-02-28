// Feature: UI | Why: Browser chrome address bar styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webInteractive, webShadow } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: BASE.panel2,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderSubtle,
    alignItems: 'center',
    gap: 6,
    ...webGlass(16),
    ...webShadow('0 1px 4px rgba(0,0,0,0.15)'),
    ...Platform.select({ default: { elevation: 4 } }),
    zIndex: 10,
  },
  navBtn: {
    width: 30, height: 30,
    borderRadius: 8,
    backgroundColor: BASE.controlBg,
    borderWidth: 1,
    borderColor: BASE.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    ...webInteractive,
  },
  navIcon: {
    color: BASE.textMuted,
    fontSize: 16, fontWeight: '500', lineHeight: 18,
  },
  addressBar: {
    flex: 1, height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BASE.border,
    paddingHorizontal: 12,
    ...webShadow('inset 0 1px 3px rgba(0,0,0,0.2)'),
    ...Platform.select({
      web: { transition: 'border-color 200ms ease' } as any,
      default: {},
    }),
  },
  lockIcon: { fontSize: 11, marginRight: 8, opacity: 0.5 },
  urlInput: {
    flex: 1, height: '100%' as any,
    color: BASE.textDim,
    fontSize: 12, letterSpacing: 0.15, fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  reloadBtn: { padding: 6, borderRadius: 6 },
  reloadIcon: { fontSize: 14, fontWeight: '500' },
  goBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8,
    ...Platform.select({
      web: {
        ...webShadow('0 1px 4px rgba(0,0,0,0.2)'),
        ...webInteractive,
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
      },
    }),
  },
  goText: {
    color: BASE.bg, fontSize: 10,
    fontWeight: '800', letterSpacing: 0.8,
  },
});
