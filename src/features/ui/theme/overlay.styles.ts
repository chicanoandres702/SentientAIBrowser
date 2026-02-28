// Feature: UI | Why: Overlay / modal / glass styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webGlass, webShadow } from './ui.primitives';

export const overlayStyles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 120, left: 0, right: 0, zIndex: 10,
    backgroundColor: BASE.panel2,
    borderBottomWidth: 1,
    borderBottomColor: BASE.border,
  },
  webViewWrapper: {
    flex: 1, backgroundColor: BASE.bg,
    position: 'relative', overflow: 'hidden',
  },
  hazeLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99, pointerEvents: 'none',
  },
  glassBackground: {
    backgroundColor: 'rgba(10, 14, 22, 0.78)',
    ...webGlass(16),
  },
  glowingShadow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: BASE.overlayBg,
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: BASE.bgElevated,
    padding: 24, borderRadius: 16,
    width: '100%', maxWidth: 400,
    borderWidth: 1, borderColor: BASE.borderMed,
    alignItems: 'center',
    ...webShadow('0 12px 40px rgba(0,0,0,0.5)'),
    ...Platform.select({ default: { elevation: 20 } }),
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700',
    color: BASE.text, marginBottom: 12, letterSpacing: 0.2,
  },
  modalText: {
    color: BASE.textDim, fontSize: 13,
    textAlign: 'center', marginBottom: 18, lineHeight: 20,
  },
  modalButton: {
    paddingHorizontal: 28, paddingVertical: 10, borderRadius: 10,
  },
  modalButtonText: {
    color: BASE.bg, fontWeight: '700', fontSize: 14,
  },
});
