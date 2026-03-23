"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectDebounceTimers = exports.redirectingTabs = exports.closedTabs = exports.syncIntervals = exports.activeUserIds = exports.activePages = exports.activeContexts = void 0;
exports.activeContexts = new Map();
exports.activePages = new Map();
// Why: track userId per tab so closePage and captureAndSyncTab can save/restore the right session
exports.activeUserIds = new Map();
// Why: store interval IDs so closePage can clear them — prevents ghost re-creation of closed tabs
exports.syncIntervals = new Map();
// Why: tombstone set — once a tab is closed, captureAndSync will never re-write its Firestore doc.
// Fixes the race where an in-flight captureAndSync finishes after closePage clears the interval.
exports.closedTabs = new Set();
// Why: redirect-settling guard — debounce concurrent framenavigated events during redirect chains
exports.redirectingTabs = new Set();
exports.redirectDebounceTimers = new Map();
//# sourceMappingURL=proxy-page-registry.js.map