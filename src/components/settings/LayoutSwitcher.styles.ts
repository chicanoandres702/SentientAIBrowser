// Feature: UI | Why: Layout switcher styles — tokenized via ui.primitives
import { StyleSheet, Platform } from 'react-native';
import { BASE, webInteractive } from '../../features/ui/theme/ui.primitives';

export const switcherStyles = StyleSheet.create({
  // Desktop pill strip
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10,
    padding: 3, borderWidth: 1, borderColor: BASE.border,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, gap: 4,
    borderWidth: 1, borderColor: 'transparent',
    ...webInteractive,
  },
  chipIcon: { fontSize: 10, color: BASE.textMuted },
  chipLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: BASE.textMuted },

  // Mobile trigger
  trigger: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, gap: 6,
    borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  triggerIcon: { fontSize: 12 },
  triggerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Mobile modal
  modalBackdrop: {
    flex: 1, backgroundColor: BASE.overlayBg, justifyContent: 'flex-end',
  },
  mobileSheet: {
    backgroundColor: BASE.bgElevated,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, paddingBottom: 40, maxHeight: '80%',
    borderTopWidth: 1, borderColor: BASE.borderStrong,
  },
  mobileHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: BASE.handleBg,
    alignSelf: 'center', marginBottom: 16,
  },
  mobileTitle: {
    color: BASE.textMuted, fontSize: 10, fontWeight: '900',
    letterSpacing: 2, marginBottom: 12, marginLeft: 4,
  },
  mobileOption: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 12, marginBottom: 4,
    borderWidth: 1, borderColor: 'transparent',
  },
  mobileOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mobileIcon: { fontSize: 18, color: BASE.textMuted, width: 24, textAlign: 'center' },
  mobileLabel: { color: BASE.textDim, fontSize: 14, fontWeight: '700' },
  mobileSub: { color: BASE.textMuted, fontSize: 11, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
});
