// Feature: Analytics | Trace: sentinel-intel.modal.tsx
/*
 * [Parent Feature/Milestone] Analytics
 * [Child Task/Issue] Sentinel Intel Modal Styles
 * [Subtask] StyleSheet for Intel modal component
 * [Upstream] None -> [Downstream] sentinel-intel.modal.tsx
 * [Law Check] 45 lines | Passed 100-Line Law
 */

import { StyleSheet } from 'react-native';

export const sentinelStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { backgroundColor: 'rgba(10, 10, 15, 0.98)', width: '100%', maxWidth: 800, height: '85%', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  pulse: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  title: { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 4 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
});
