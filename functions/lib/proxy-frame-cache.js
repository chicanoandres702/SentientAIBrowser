"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedFrame = exports.getCachedFrame = exports.capturingTabs = exports.frameCache = void 0;
exports.frameCache = new Map();
// Why: in-flight guard ensures the 4fps broker interval doesn't queue behind a slow capture.
exports.capturingTabs = new Set();
const getCachedFrame = (tabId) => { var _a; return (_a = exports.frameCache.get(tabId)) !== null && _a !== void 0 ? _a : null; };
exports.getCachedFrame = getCachedFrame;
const setCachedFrame = (tabId, f) => {
    exports.frameCache.set(tabId, Object.assign(Object.assign({}, f), { ts: Date.now() }));
};
exports.setCachedFrame = setCachedFrame;
//# sourceMappingURL=proxy-frame-cache.js.map