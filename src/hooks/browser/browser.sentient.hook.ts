// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Sentient browser orchestration hook
 * [Subtask] Master orchestrator composing browser capabilities and integration hooks
 * [Upstream] Monolithic useSentientBrowser -> [Downstream] Composition pattern
 * [Law Check] 95 lines | Passed 100-Line Law
 */

import { useState, useCallback } from 'react';
import { useBrowserCapabilities } from './browser.capabilities.hook';
import { useBrowserIntegration } from './browser.integration.hook';
import { useRemoteSyncBridge } from './browser.remotesync.hook';
import { logger } from '../../features/core/core.logger.service';

export interface BrowserAPI {
  navigate: (url: string) => void;
  click: (selector: string) => void;
  type: (text: string) => void;
  scanDom: () => void;
  takeScreenshot: () => void;
  updateTab: (tabId: string, updates: Record<string, unknown>) => void;
}

export const useSentientBrowser = (): BrowserAPI & { tabs: unknown[]; isLoading: boolean } => {
  const [tabs, setTabs] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const capabilities = useBrowserCapabilities({ tabs, setTabs, isLoading, setIsLoading });
  const integration = useBrowserIntegration({ tabs, setTabs });
  const _remoteSyncBridge = useRemoteSyncBridge({ tabs, setTabs });

  const navigate = useCallback((url: string) => {
    logger.debug('useSentientBrowser', 'Navigating to URL', { url });
    integration.navigate?.(url);
  }, [integration]);

  const click = useCallback((selector: string) => {
    logger.debug('useSentientBrowser', 'Clicking element', { selector });
    integration.click?.(selector);
  }, [integration]);

  const type = useCallback((text: string) => {
    logger.debug('useSentientBrowser', 'Typing text', { textLength: text.length });
    integration.type?.(text);
  }, [integration]);

  const scanDom = useCallback(() => {
    logger.debug('useSentientBrowser', 'Scanning DOM');
    integration.scanDom?.();
  }, [integration]);

  const takeScreenshot = useCallback(() => {
    logger.debug('useSentientBrowser', 'Taking screenshot');
    capabilities.takeScreenshot?.();
  }, [capabilities]);

  const updateTab = useCallback(
    (tabId: string, updates: Record<string, unknown>) => {
      logger.debug('useSentientBrowser', 'Updating tab', { tabId, updates });
      setTabs((prev) => prev.map((t: any) => (t.id === tabId ? { ...t, ...updates } : t)));
    },
    []
  );

  return {
    tabs,
    isLoading,
    navigate,
    click,
    type,
    scanDom,
    takeScreenshot,
    updateTab,
  };
};
