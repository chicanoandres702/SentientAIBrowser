// Feature: Tab Management | Trace: src/features/tab-management/tab.types.ts
/*
 * [Core Domain] Tab state contract
 * [Upstream] Browser state → [Downstream] Components/Hooks
 */

export interface TabItem {
  id: string;
  title: string;
  isActive: boolean;
  url?: string;
}
