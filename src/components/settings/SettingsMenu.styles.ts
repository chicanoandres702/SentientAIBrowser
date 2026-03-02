// Feature: Settings | Trace: README.md
import { StyleSheet, Platform } from 'react-native';
export const settingsMenuStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3, 5, 10, 0.82)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '92%',
    ...Platform.select({ web: { boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)' } as any, default: { elevation: 20 } }),
  },
  handleBar: { width: 36, height: 3, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4, opacity: 0.5 },
  header: { paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { marginTop: 2, fontSize: 11, fontWeight: '500' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  closeIcon: { fontSize: 14, lineHeight: 18 },
  body: { padding: 16 },
  section: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 10, marginTop: 10, marginLeft: 2 },
  sectionCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  layoutHint: { fontSize: 11, marginBottom: 10, lineHeight: 16 },
  daemonBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 14, gap: 10, marginBottom: 8 },
  daemonDot: { width: 7, height: 7, borderRadius: 3.5 },
  daemonText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, fontSize: 12 },
  footer: { padding: 12, borderTopWidth: 1, alignItems: 'center' },
  version: { fontSize: 8, letterSpacing: 2, fontWeight: '700' },
});
