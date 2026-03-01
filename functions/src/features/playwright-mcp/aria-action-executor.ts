// Feature: Playwright MCP | Trace: functions/src/features/playwright-mcp/aria-action-executor.ts
/*
 * [Pure Logic] ARIA locator resolution and action execution
 * [Upstream] Route handlers → [Downstream] Playwright page
 * [Why] Extracted from proxy-routes-action to reduce route handler size
 */
import { Page } from 'playwright-core';

export type LocatorType = 'role' | 'label' | 'text' | 'id';

export interface ActionRequest {
  action: 'click' | 'type';
  role?: string;
  ariaName?: string;
  ariaText?: string;
  id?: string;
  value?: string;
}

/** Resolve ARIA selector to Playwright locator */
const resolveLocator = (page: Page, req: ActionRequest) => {
  const { role, ariaName, ariaText, id } = req;

  if (role) {
    return page.getByRole(role as any, ariaName ? { name: ariaName, exact: false } : undefined);
  }
  if (ariaName) {
    return page.getByLabel(ariaName, { exact: false });
  }
  if (ariaText) {
    return page.getByText(ariaText, { exact: false });
  }
  if (id) {
    return page.locator(`[data-ai-id="${id}"]`);
  }

  throw new Error('No element selector provided (need role, name, text, or id)');
};

/** Execute click or type action on element */
export const executeAriaAction = async (page: Page, req: ActionRequest): Promise<string> => {
  const locator = resolveLocator(page, req);

  if (req.action === 'click') {
    await locator.first().scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
    await locator.first().click({ timeout: 8000 });
  } else if (req.action === 'type') {
    await locator.first().click({ timeout: 5000 });
    await locator.first().fill(req.value || '');
    if (req.value?.length) {
      await page.keyboard.press('Enter');
    }
  }

  await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {});
  return page.url();
};
