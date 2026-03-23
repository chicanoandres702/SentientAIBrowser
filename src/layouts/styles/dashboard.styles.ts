// Feature: Layout | Why: Dashboard-specific styles — tokenized via ui.primitives
import { StyleSheet } from 'react-native';
import { BASE } from '../../features/ui/theme/ui.primitives';

export const dashboardStyles = StyleSheet.create({
  dashboardLeft: { flex: 1, flexDirection: 'column' },
  dashboardInfoBar: {
    height: 200, borderTopWidth: 1,
    padding: 8, flexDirection: 'row', gap: 8,
  },
  dashboardPanel: {
    flex: 1, backgroundColor: BASE.panel,
    borderRadius: 12, borderWidth: 1,
    borderColor: BASE.border, overflow: 'hidden',
  },
  dashboardPanelHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: BASE.borderSubtle, gap: 8,
  },
  dashboardPanelDot: { width: 6, height: 6, borderRadius: 3 },
  dashboardPanelTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  dashboardPanelBody: { flex: 1, padding: 4 },
});
