/**
 * Sentient File Header
 * Why: Frame cache for Sentient AI Browser
 * Filepath: functions/src/proxy-frame-cache.ts
 * Description: Shared cache for tab screenshot frames, prevents concurrent calls
 * Trace: Used by broker, capture service, and SSE stream
 * Wiring: Exported cache and helpers, consumed by broker and capture modules
 */
// Feature: Frame Cache | Trace: README.md
// Why: shared frame cache prevents concurrent page.screenshot() calls from stacking and hanging.
// getCachedFrame / setCachedFrame are the single-writer, multi-reader API consumed by the broker
// interval, captureAndSync, and the SSE screenshot stream so only one screenshot is in flight.

export const frameCache = new Map<string, { data: string; url: string; ts: number }>();
// Why: in-flight guard ensures the 4fps broker interval doesn't queue behind a slow capture.
export const capturingTabs = new Set<string>();

export const getCachedFrame = (tabId: string) => frameCache.get(tabId) ?? null;

export const setCachedFrame = (tabId: string, f: { data: string; url: string }): void => {
    frameCache.set(tabId, { ...f, ts: Date.now() });
};
