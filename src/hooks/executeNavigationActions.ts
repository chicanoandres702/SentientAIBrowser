// Feature: Core | Trace: README.md
/**
 * AIDDE Metadata
 * Purpose: Navigation actions — navigate, scan_dom, lookup_documentation
 * Type: Handler
 * Max Lines: 60 (target: 28)
 */

import React from 'react';

interface NavigationStep {
  action: string;
  value?: string;
}

interface NavigationContext {
  webViewRef: React.RefObject<{ scanDOM: () => void }>;
  navigateActiveTab?: (url: string) => Promise<void>;
  setActiveUrl?: (url: string) => void;
  setStatusMessage: (m: string) => void;
}

export const executeNavigationActions = async (step: NavigationStep, ctx: NavigationContext): Promise<boolean> => {
  if (step.action === 'navigate' && step.value) {
    ctx.setStatusMessage('Navigating...');
    if (ctx.navigateActiveTab) {
      await ctx.navigateActiveTab(step.value);
    } else {
      ctx.setActiveUrl?.(step.value);
    }
    return true;
  }

  if (step.action === 'scan_dom') {
    ctx.webViewRef.current?.scanDOM();
    ctx.setStatusMessage('Scanning DOM...');
    return true;
  }

  if (step.action === 'lookup_documentation') {
    ctx.setStatusMessage('Docs lookup disabled');
    return false;
  }

  return false;
};
