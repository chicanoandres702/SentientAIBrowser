// Feature: Browser | Why: Preview component renders screenshot from proxy/Firestore
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Image, Platform, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../features/auth/firebase-config';
import { checkProxyHealth, fetchDirectScreenshot } from '../features/browser/services/proxy-health.service';
import { previewStyles as styles } from '../features/browser/components/BrowserPreview.styles';
import { PreviewLoader, StaleBadge, EmptyState } from '@features/browser';
import { uiColors } from '../features/ui/theme/ui.theme';
import { dimAccent } from '../features/ui/theme/domain-accent.utils';
import { useRemoteMirrorInteraction } from '../features/browser/hooks/use-remote-mirror-interaction';

type PreviewStatus = 'loading' | 'checking_proxy' | 'ready' | 'no_tab' | 'waiting_for_screenshot' | 'proxy_offline' | 'snapshot_error' | 'stale';
const STALE_THRESHOLD_MS = 45_000;
const DIRECT_FETCH_BASE_DELAY_MS = 4_000;
const DIRECT_FETCH_MAX_DELAY_MS = 20_000;
const MAX_DIRECT_RETRIES = 5;

interface Props {
  tabId: string;
  theme: 'red' | 'blue';
  onPress?: (x: number, y: number, w: number, h: number) => void;
  onMouseMove?: (x: number, y: number, w: number, h: number) => void;
  onScroll?: (deltaX: number, deltaY: number) => void;
}

export const BrowserPreview: React.FC<Props> = ({ tabId, theme, onPress, onMouseMove, onScroll }) => {
  const { containerRef } = useRemoteMirrorInteraction(onMouseMove, onScroll);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [containerSize, setContainerSize] = useState({ w: 1, h: 1 });
  const [proxyOnline, setProxyOnline] = useState<boolean | null>(null);
  const directRetryCount = useRef(0);
  const directPollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopDirectPoll = useCallback(() => {
    if (directPollTimer.current) { clearInterval(directPollTimer.current); directPollTimer.current = null; }
  }, []);
  const startDirectPoll = useCallback((tid: string) => { stopDirectPoll(); directRetryCount.current = 0; const poll = async () => { if (directRetryCount.current >= MAX_DIRECT_RETRIES) { stopDirectPoll(); return; } directRetryCount.current++; const img = await fetchDirectScreenshot(tid); if (img) { setScreenshot(img); setError(null); setLoading(false); setStatus('ready'); stopDirectPoll(); return; } const backoff = Math.min(DIRECT_FETCH_BASE_DELAY_MS * Math.pow(2, directRetryCount.current - 1), DIRECT_FETCH_MAX_DELAY_MS); directPollTimer.current = setTimeout(poll, backoff + Math.floor(Math.random() * 700)); }; directPollTimer.current = setTimeout(poll, DIRECT_FETCH_BASE_DELAY_MS); }, [stopDirectPoll]);
  const handleRetry = useCallback(async () => {
    if (!tabId) return;
    setLoading(true); setStatus('checking_proxy'); setError(null);
    const health = await checkProxyHealth();
    setProxyOnline(health.ok);
    if (!health.ok) { setLoading(false); setStatus('proxy_offline'); return; }
    const img = await fetchDirectScreenshot(tabId);
    if (img) { setScreenshot(img); setLoading(false); setStatus('ready'); }
    else { setLoading(false); setStatus('waiting_for_screenshot'); startDirectPoll(tabId); }
  }, [tabId, startDirectPoll]);
  useEffect(() => {
    if (!tabId) { setError('No tab selected'); setLoading(false); setStatus('no_tab'); return; }
    setLoading(true); setStatus('checking_proxy'); setError(null);
    const tabRef = doc(db, 'browser_tabs', tabId);
    let alive = true;
    checkProxyHealth().then((h) => { if (!alive) return; setProxyOnline(h.ok); if (!h.ok) { setLoading(false); setStatus('proxy_offline'); } else { setStatus('loading'); } });
    const unsub = onSnapshot(tabRef, (snap) => {
      if (!alive) return;
      if (!snap.exists()) { if (proxyOnline === false) { setLoading(false); setStatus('proxy_offline'); } else if (proxyOnline === true) { setStatus('waiting_for_screenshot'); } return; }
      const d = snap.data();
      if (d?.screenshot) {
        setScreenshot(d.screenshot); setError(null); setLoading(false); setStatus('ready'); stopDirectPoll();
        if (d.last_sync && Date.now() - new Date(d.last_sync).getTime() > STALE_THRESHOLD_MS) setStatus('stale');
      } else { setScreenshot(null); setLoading(false); setStatus('waiting_for_screenshot'); }
    }, () => { if (alive) { setLoading(false); setError('Preview sync failed'); setStatus('snapshot_error'); } });
    const fb = setTimeout(() => { if (alive) startDirectPoll(tabId); }, 5000);
    return () => { alive = false; clearTimeout(fb); unsub(); stopDirectPoll(); };
  }, [tabId]);
  const colors = uiColors(theme);
  const accent = colors.accent;
  const dim = dimAccent(accent);
  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={e => setContainerSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      onStartShouldSetResponder={() => !!onPress}
      onResponderGrant={e => onPress?.(e.nativeEvent.locationX, e.nativeEvent.locationY, containerSize.w, containerSize.h)}
    >
      {loading && !screenshot && <PreviewLoader status={status} accent={accent} />}
      {screenshot && (Platform.OS === 'web'
        ? <View style={[styles.screenshot, { backgroundImage: `url("${screenshot}")`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' } as any]} />
        : <Image source={{ uri: screenshot }} style={styles.screenshot} resizeMode="contain" onError={() => { setError('Failed'); setScreenshot(null); setStatus('snapshot_error'); }} />
      )}
      {status === 'stale' && screenshot && <StaleBadge onRetry={handleRetry} accent={accent} dimAccent={dim} />}
      {!loading && !screenshot && <EmptyState status={status} error={error} proxyOnline={proxyOnline} onRetry={handleRetry} accent={accent} dimAccent={dim} />}
    </View>
  );
};
