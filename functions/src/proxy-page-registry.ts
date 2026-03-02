// Feature: Page Registry | Trace: README.md
import { Page, BrowserContext } from 'playwright';

export const activeContexts = new Map<string, BrowserContext>();
export const activePages = new Map<string, Page>();
// Why: track userId per tab so closePage and captureAndSyncTab can save/restore the right session
export const activeUserIds = new Map<string, string>();
// Why: store interval IDs so closePage can clear them — prevents ghost re-creation of closed tabs
export const syncIntervals = new Map<string, ReturnType<typeof setInterval>>();
// Why: tombstone set — once a tab is closed, captureAndSync will never re-write its Firestore doc.
// Fixes the race where an in-flight captureAndSync finishes after closePage clears the interval.
export const closedTabs = new Set<string>();
// Why: redirect-settling guard — debounce concurrent framenavigated events during redirect chains
export const redirectingTabs = new Set<string>();
export const redirectDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
