// Feature: Browser | Why: Preview styles — tokenized via ui.primitives
import { StyleSheet } from 'react-native';
import { BASE } from '../../ui/theme/ui.primitives';

export const previewStyles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BASE.bg,
    justifyContent: 'center', alignItems: 'center',
  },
  loader: { position: 'absolute', zIndex: 10, alignItems: 'center' },
  loadingText: {
    color: BASE.textMuted, marginTop: 10,
    fontSize: 12, fontWeight: '500', letterSpacing: 0.3,
  },
  screenshot: {
    width: '100%', height: '100%', backgroundColor: '#000',
  },
  noPreview: {
    position: 'absolute', zIndex: 5,
    alignItems: 'center', paddingHorizontal: 24,
  },
  statusTitle: {
    color: BASE.textMuted, fontSize: 14,
    fontWeight: '600', marginBottom: 10,
  },
  statusHint: {
    color: BASE.textFaint, fontSize: 12,
    textAlign: 'center', lineHeight: 18, marginBottom: 14,
  },
  retryBtn: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 8, marginTop: 4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '600' },
  proxyHint: {
    color: BASE.textFaint, fontSize: 10,
    marginTop: 14, letterSpacing: 0.5,
  },
  staleBadge: {
    position: 'absolute', top: 8, right: 8, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  staleBadgeText: {
    color: '#fbbf24', fontSize: 11, fontWeight: '500',
  },
  retrySmall: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  retrySmallText: { fontSize: 10, fontWeight: '600' },
});
