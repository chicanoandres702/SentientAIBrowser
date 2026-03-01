// Feature: Tab Management | Trace: src/features/tab-management/tab.utils.ts
/*
 * [Pure Logic] Tab domain extraction and favicon generation
 * [Reason] Extracted from WorkflowSelector.tsx to reduce component size
 * [Reused By] WorkflowSelector, TabButton, TabList
 */

/** Extract hostname from URL, strip www prefix */
export const getDomain = (url?: string): string => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, '') : 'new tab';
  } catch {
    return url || 'new tab';
  }
};

/** Extract first letter for favicon badge */
export const getInitial = (title: string, url?: string): string => {
  try {
    if (url && url !== 'about:blank') {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      return domain.charAt(0).toUpperCase();
    }
  } catch {}
  return title.replace(/^New Tab$/i, '').charAt(0).toUpperCase() || '🌐';
};

/** Type guard: validate tab object structure */
export const isValidTab = (tab: any): tab is { id: string; title: string; isActive: boolean; url?: string } => {
  return typeof tab === 'object' && typeof tab.id === 'string' && typeof tab.title === 'string' && typeof tab.isActive === 'boolean';
};
