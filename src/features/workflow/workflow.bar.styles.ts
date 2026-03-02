// Feature: Workflow | Trace: src/features/workflow/workflow.bar.styles.ts
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] WorkflowBar style definitions
 * [Subtask] Pill-shaped workflow switcher bar above the tab strip
 * [Upstream] None -> [Downstream] workflow.bar.component.tsx
 * [Law Check] 22 lines | Passed 100-Line Law
 */
import { StyleSheet } from 'react-native';
import { BASE } from '@features/ui/theme/ui.primitives';

export const wbs = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderBottomWidth: 1 },
  scroll: { gap: 6, flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 18, borderWidth: 1, gap: 5 },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  count: { fontSize: 9, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 },
  closeBtn: { width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 9, fontWeight: '700' },
  addBtn: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  addBtnText: { fontSize: 18, fontWeight: '300', lineHeight: 22 },
});
