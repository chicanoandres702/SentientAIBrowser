// Feature: Playwright MCP Adapter | Why: @playwright/mcp uses ARIA snapshots + role-based
// locators under the hood. We expose the same primitives directly on our persistent page
// so backend-mission.executor never touches fragile index-based data-ai-id attributes again.
import { Page } from 'playwright';

export interface AriaStep {
    action: 'click' | 'type' | 'navigate' | 'wait' | 'done' | 'wait_for_user' | 'ask_user';
    role?: string;    // ARIA role: 'button' | 'link' | 'textbox' | 'checkbox' | 'combobox'
    name?: string;    // Accessible name (label or visible text) — most stable identifier
    label?: string;   // aria-label / <label> text fallback
    text?: string;    // Visible text content fallback (last resort)
    url?: string;     // For 'navigate' action
    value?: string;   // For 'type' action
    explanation: string;
}

/**
 * Get the ARIA accessibility snapshot of the current page.
 * This is what @playwright/mcp's browser_snapshot tool returns — a structured text
 * representation of every interactive element keyed by role + accessible name.
 */
export async function getAriaSnapshot(page: Page): Promise<string> {
    try {
        return await (page as any).ariaSnapshot();
    } catch {
        // Fallback: build readable text tree from interactive elements
        return page.evaluate(() => {
            const els = document.querySelectorAll(
                'button, a[href], input, select, textarea, [role], h1, h2, h3, label'
            );
            return Array.from(els).map(el => {
                const role = el.getAttribute('role') || el.tagName.toLowerCase();
                const name = ((el as HTMLElement).innerText || '').trim().slice(0, 80)
                    || el.getAttribute('aria-label')
                    || (el as HTMLInputElement).placeholder || '';
                return name ? `${role} "${name}"` : null;
            }).filter(Boolean).join('\n');
        });
    }
}

/**
 * Execute a single ARIA-based action on the Playwright page.
 * Resolves elements by role+name at call time — never references stale DOM indices.
 * Equivalent to @playwright/mcp's browser_click / browser_type / browser_navigate tools.
 */
export async function executeAriaAction(page: Page, step: AriaStep): Promise<void> {
    const { action, role, name, label, text, url, value } = step;

    if (action === 'navigate' && url) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return;
    }
    if (action === 'wait') { await page.waitForTimeout(2000); return; }
    if (action === 'done' || action === 'wait_for_user' || action === 'ask_user') return;

    // Build locator — role+name is the most reliable (matches @playwright/mcp's ref system)
    let locator;
    if (role && name) {
        locator = page.getByRole(role as any, { name, exact: false });
    } else if (label) {
        locator = page.getByLabel(label, { exact: false });
    } else if (text) {
        locator = page.getByText(text, { exact: false }).first();
    } else {
        throw new Error(`AriaAction has no selector. Provide role+name, label, or text. (${step.explanation})`);
    }

    await locator.waitFor({ state: 'visible', timeout: 8000 });
    await locator.scrollIntoViewIfNeeded();

    if (action === 'click') {
        await locator.click({ timeout: 8000 });
    } else if (action === 'type' && value !== undefined) {
        await locator.fill(value);
    }

    // Wait for any navigation or DOM update triggered by the action to settle
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
}
