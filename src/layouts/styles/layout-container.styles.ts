// Feature: Layout | Why: Isolated styles prevent style bleed across layout sections
import { StyleSheet } from 'react-native';
import { BASE } from '../../features/ui/theme/ui.primitives';

export const layoutSectionStyles = StyleSheet.create({
  mainRow: { flex: 1, flexDirection: 'row' },
  mainColumn: { flex: 1, flexDirection: 'column' },
  contentAreaRow: {
    flex: 1, flexDirection: 'column', backgroundColor: BASE.bg,
  },
  contentAreaColumn: {
    flex: 1, flexDirection: 'column', backgroundColor: BASE.bg,
  },
  splitContent: { flex: 1 },
  zenContent: { backgroundColor: BASE.bgDeep },
});
