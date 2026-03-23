// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Preview states components
 * [Subtask] Sub-components for preview loading, stale, and empty states
 * [Upstream] Preview status + callbacks -> [Downstream] UI state components
 * [Law Check] 51 lines | Passed 100-Line Law
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { previewStyles as styles } from './components/BrowserPreview.styles';
import { PROXY_BASE } from './services/proxy-health.service';
import { BASE } from '@features/ui/theme/ui.theme';

export const PreviewLoader = ({ status, accent }: { status: string; accent: string }) => (
  <View style={styles.loader}>
    <ActivityIndicator color={accent} size="large" />
    <Text style={styles.loadingText}>
      {status === 'checking_proxy' ? 'Checking proxy…' : 'Loading preview…'}
    </Text>
  </View>
);

export const StaleBadge = ({ onRetry, accent, dimAccent }: any) => (
  <View style={styles.staleBadge}>
    <Text style={styles.staleBadgeText}>⏳ Preview may be stale</Text>
    <TouchableOpacity onPress={onRetry} style={[styles.retrySmall, { borderColor: dimAccent }]}>
      <Text style={[styles.retrySmallText, { color: accent }]}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

export const EmptyState = ({
  status,
  error,
  proxyOnline,
  onRetry,
  accent,
  dimAccent,
}: any) => (
  <View style={styles.noPreview}>
    <Text style={styles.statusTitle}>
      {status === 'snapshot_error'
        ? '⚠ Preview Error'
        : status === 'proxy_offline'
        ? '🔌 Proxy Offline'
        : 'Browser Preview'}
    </Text>
    {status === 'waiting_for_screenshot' && (
      <Text style={styles.statusHint}>
        Waiting for screenshot sync…{'\n'}The proxy is capturing the page.
      </Text>
    )}
    {status === 'proxy_offline' && (
      <Text style={styles.statusHint}>
        Cannot reach the proxy at
        {'\n'}
        {PROXY_BASE}
        {'\n\n'}
        Start the proxy server and tap Retry.
      </Text>
    )}
    {status === 'snapshot_error' && (
      <Text style={[styles.statusHint, { color: BASE.danger }]}>
        {error || 'Preview failed to load'}
      </Text>
    )}
    {status === 'no_tab' && <Text style={styles.statusHint}>No active tab selected.</Text>}
    {['proxy_offline', 'snapshot_error', 'waiting_for_screenshot'].includes(status) && (
      <TouchableOpacity onPress={onRetry} style={[styles.retryBtn, { borderColor: dimAccent }]}>
        <Text style={[styles.retryBtnText, { color: accent }]}>⟳  Retry</Text>
      </TouchableOpacity>
    )}
    {status !== 'no_tab' && (
      <Text style={styles.proxyHint}>
        {proxyOnline === true
          ? '● Proxy online'
          : proxyOnline === false
          ? '○ Proxy unreachable'
          : '◌ Checking…'}
      </Text>
    )}
  </View>
);

PreviewLoader.displayName = 'PreviewLoader';
StaleBadge.displayName = 'StaleBadge';
EmptyState.displayName = 'EmptyState';
