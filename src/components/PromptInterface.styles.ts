// Feature: UI | Why: Prompt interface styles — tokenized via ui.primitives
import { StyleSheet } from 'react-native';
import { BASE } from '../features/ui/theme/ui.primitives';

export const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: BASE.bgElevated,
    borderTopWidth: 1,
    gap: 8,
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
  promptGlyph: {
    fontSize: 12, fontWeight: '900', marginRight: 8, opacity: 0.8,
  },
  input: {
    flex: 1, color: BASE.text, fontSize: 12, maxHeight: 68,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sendIcon: {
    color: BASE.bg, fontSize: 14, fontWeight: 'bold',
  },
});
