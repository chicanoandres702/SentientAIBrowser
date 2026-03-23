// Feature: Hooks | Trace: README.md
/*
 * [Parent Feature/Milestone] Hooks
 * [Child Task/Issue] Backwards compatibility exports
 * [Subtask] Re-export all hooks from new feature directories for gradual migration
 * [Upstream] Old src/hooks -> [Downstream] New src/hooks/{feature}
 * [Law Check] 14 lines | Passed 100-Line Law
 */

export { useAsyncData, type AsyncState } from './async';
export { useService, useServiceData } from './service';
export { useFormFields, type FormField } from './form';
export { useTaskQueue } from './task';
export { useSentientBrowser } from './browser';
