// Feature: Android Layout | Trace: src/layouts/android/
// Why: Centralised Android-specific dimension constants and stylesheet atoms
//      so every Android component pulls from one source of truth.
import { StyleSheet } from 'react-native';
import { BASE } from '../../features/ui/theme/ui.primitives';

// ── Dimensions ─────────────────────────────────────────────────────────────
export const A = Object.freeze({
  navBarH:    56,
  addrBarH:   48,
  sheetRadius: 20,
  sheetHandleW: 36,
  sheetHandleH: 4,
  tabIconSz:  24,
  fabSz:      52,
  hitSlop:    { top: 8, bottom: 8, left: 8, right: 8 },
});

// ── Base sheet style (reused by AI sheet + Tabs drawer) ────────────────────
export const sheetBase = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BASE.panel,
    borderTopLeftRadius:  A.sheetRadius,
    borderTopRightRadius: A.sheetRadius,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
    width:  A.sheetHandleW,
    height: A.sheetHandleH,
    borderRadius: 2,
    backgroundColor: BASE.handleBg,
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: BASE.textMuted,
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
  },
});
