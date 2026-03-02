// Feature: UI | Trace: README.md
/*
 * [Parent Feature/Milestone] UI
 * [Child Task/Issue] Backwards compatibility exports
 * [Subtask] Re-export from new feature locations for gradual migration
 * [Upstream] Old src/components -> [Downstream] New src/features/ui
 * [Law Check] 10 lines | Passed 100-Line Law
 */

export { Card, Section, Stack, Grid, SPACING, RADIUS, SHADOWS } from '../features/ui';
export { withAuth, withErrorBoundary, withLoading, compose } from '../features/ui';
