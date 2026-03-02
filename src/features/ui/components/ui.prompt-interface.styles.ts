// Feature: UI | Source: PromptInterface.styles.ts
// Task: Migrate prompt interface styles to feature module
import { StyleSheet, Platform } from 'react-native';
import { BASE } from '@features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: BASE.bgElevated,
    borderTopWidth: 1,
  },
  planningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 7,
    paddingBottom: 5,
  },
  planningDot: {
    width: 5, height: 5, borderRadius: 3,
    ...Platform.select({ web: { animation: 'pulse 1s ease-in-out infinite' } as any, default: {} }),
  },
  planningText: {
    fontSize: 8, fontWeight: '900', letterSpacing: 1.6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 6,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BASE.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BASE.borderFocusStrong,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputWrapPlanning: {
    borderColor: 'rgba(140,160,200,0.08)',
    opacity: 0.6,
  },
  promptGlyph: {
    fontSize: 12, fontWeight: '900', marginRight: 8, opacity: 0.8,
  },
  input: {
    flex: 1, color: BASE.text, fontSize: 12, maxHeight: 68,
  },
  inputDisabled: {
    color: BASE.textFaint,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnPlanning: {
    ...Platform.select({ web: { animation: 'spin 1s linear infinite' } as any, default: {} }),
  },
  sendIcon: {
    color: BASE.bg, fontSize: 14, fontWeight: 'bold',
  },
  sendIconSpin: {
    ...Platform.select({ web: { display: 'inline-block', animation: 'spin 0.9s linear infinite' } as any, default: {} }),
  },
});
