// Feature: Browser Control | Trace: src/features/browser-control/useManualInput.ts
/*
 * [Reusable Hook] Manual text/key input to Playwright
 * [Upstream] UI input → [Downstream] Proxy endpoint
 * [Why] Extracted from useSentientBrowser to enable reuse and reduce hook complexity
 */
import { useCallback } from 'react';

export interface ManualInputDeps {
  PROXY_BASE_URL: string;
  activeTabId?: string;
}

export const useManualInput = ({ PROXY_BASE_URL, activeTabId }: ManualInputDeps) => {
  const handleManualType = useCallback(
    async (text: string): Promise<void> => {
      if (!PROXY_BASE_URL) return;
      await fetch(`${PROXY_BASE_URL}/proxy/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tabId: activeTabId || 'default' }),
      }).catch(() => {});
    },
    [PROXY_BASE_URL, activeTabId],
  );

  const handleManualKeyPress = useCallback(
    async (key: string): Promise<void> => {
      if (!PROXY_BASE_URL) return;
      await fetch(`${PROXY_BASE_URL}/proxy/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, tabId: activeTabId || 'default' }),
      }).catch(() => {});
    },
    [PROXY_BASE_URL, activeTabId],
  );

  return { handleManualType, handleManualKeyPress };
};
