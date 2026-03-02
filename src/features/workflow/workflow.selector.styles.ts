// Feature: Workflow | Trace: workflow.selector.styles.ts
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] Workflow selector styles
 * [Subtask] StyleSheet for workflow selector component
 * [Upstream] None -> [Downstream] workflow.selector.component.tsx
 * [Law Check] 28 lines | Passed 100-Line Law
 */

import { StyleSheet } from 'react-native';
import { BASE } from '@features/ui/theme/ui.primitives';

export const wss = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BASE.borderSubtle },
  header: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, color: BASE.textFaint, marginBottom: 8 },
  workflowList: { gap: 6 },
  workflowButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: BASE.borderMed, backgroundColor: BASE.inputBg },
  workflowButtonActive: { backgroundColor: BASE.borderFocusStrong, borderColor: '#5aa8ff' },
  favicon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: BASE.bg },
  faviconText: { fontSize: 14, fontWeight: '700' },
  workflowInfo: { flex: 1 },
  workflowTitle: { fontSize: 11, fontWeight: '600', color: BASE.text },
  workflowUrl: { fontSize: 9, color: BASE.textMuted, marginTop: 2 },
  closeBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  closeBtnText: { fontSize: 14, color: BASE.textMuted, fontWeight: '300' },
  addButton: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: BASE.borderMed, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: BASE.textMuted },
});
