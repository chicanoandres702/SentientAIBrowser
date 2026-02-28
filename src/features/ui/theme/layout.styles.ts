// Feature: UI | Why: Layout shell styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webShadow } from './ui.primitives';

export const layoutStyles = {
  ...StyleSheet.create({
    container: {
      flex: 1,
      height: Platform.OS === 'web' ? '100vh' as any : '100%',
      backgroundColor: BASE.bg,
    },
    header: {
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: BASE.panel,
      borderBottomWidth: 1,
      borderBottomColor: BASE.borderSubtle,
      paddingTop: Platform.OS === 'web' ? 8 : 48,
      ...Platform.select({
        web: {
          ...webGlass(16),
          zIndex: 100,
          ...webShadow('0 1px 8px rgba(0,0,0,0.2)'),
        } as any,
      }),
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: 16, fontWeight: '800',
      color: BASE.text, letterSpacing: 0.2,
      ...Platform.select({
        web: { textShadow: '0 0 8px rgba(110,160,255,0.12)' } as any,
        default: {
          textShadowColor: 'rgba(110,160,255,0.12)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        },
      }),
      marginBottom: 0,
    },
    headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: {
      padding: 6, borderRadius: 8,
      backgroundColor: BASE.controlBg,
      ...Platform.select({
        web: { transition: 'all 150ms ease', cursor: 'pointer' } as any,
      }),
    },
    mainLayout: { flex: 1, flexDirection: 'row' },
    contentArea: {
      flex: 1, flexDirection: 'column', backgroundColor: BASE.bg,
    },
    sidebar: {
      width: 340, borderLeftWidth: 1,
      borderLeftColor: BASE.border,
      backgroundColor: BASE.panelDim,
      display: 'flex', flexDirection: 'column',
      ...webShadow('-4px 0 16px rgba(0,0,0,0.3)'),
      ...Platform.select({ web: { zIndex: 50 } as any }),
    },
    sidebarContent: { flex: 1 },
    mobileSidebarOverlay: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0, top: 0,
      backgroundColor: BASE.bg, zIndex: 100, padding: 8,
    },
    closeSidebarButton: {
      padding: 10, alignItems: 'center',
      borderTopWidth: 1, borderTopColor: BASE.border,
    },
  }),
};

