"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAriaSnapshot = getAriaSnapshot;
exports.executeAriaAction = executeAriaAction;
/**
 * Get the ARIA accessibility snapshot of the current page.
 * This is what @playwright/mcp's browser_snapshot tool returns — a structured text
 * representation of every interactive element keyed by role + accessible name.
 */
async function getAriaSnapshot(page) {
    try {
        return await page.ariaSnapshot();
    }
    catch (_a) {
        // Fallback: build readable text tree from interactive elements
        return page.evaluate(() => {
            const els = document.querySelectorAll('button, a[href], input, select, textarea, [role], h1, h2, h3, label');
            return Array.from(els).map(el => {
                const role = el.getAttribute('role') || el.tagName.toLowerCase();
                const name = (el.innerText || '').trim().slice(0, 80)
                    || el.getAttribute('aria-label')
                    || el.placeholder || '';
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
async function executeAriaAction(page, step) {
    const { action, role, name, label, text, url, value } = step;
    if (action === 'navigate' && url) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        return;
    }
    if (action === 'wait') {
        await page.waitForTimeout(2000);
        return;
    }
    if (action === 'done' || action === 'wait_for_user' || action === 'ask_user')
        return;
    // Build locator candidates in priority order — role+name most stable, text last resort
    const candidates = [];
    if (role && name)
        candidates.push(page.getByRole(role, { name, exact: false }));
    if (name)
        candidates.push(page.getByText(name, { exact: false }).first());
    if (label)
        candidates.push(page.getByLabel(label, { exact: false }));
    if (text)
        candidates.push(page.getByText(text, { exact: false }).first());
    // Why: many login forms use <input type="submit" value="Login"> — getByRole often misses
    // these because Playwright's ARIA resolver uses accessible name from value attribute.
    // CSS attribute selectors (value*=) work reliably on input elements.
    if (action === 'click' && name) {
        const esc = name.replace(/"/g, '\\"');
        candidates.push(page.locator(`input[type="submit"][value*="${esc}" i], input[type="button"][value*="${esc}" i]`));
    }
    // Last resort: click whatever submit control exists on the page
    if (action === 'click')
        candidates.push(page.locator(`[type="submit"]`).first());
    if (candidates.length === 0)
        throw new Error(`AriaAction needs role+name, label, or text. (${step.explanation})`);
    // Find first candidate that is already visible (fast 2s probe per candidate)
    let locator = candidates[0];
    for (const c of candidates) {
        try {
            if ((await c.count()) > 0) {
                await c.waitFor({ state: 'visible', timeout: 2000 });
                locator = c;
                break;
            }
        }
        catch ( /* try next */_a) { /* try next */ }
    }
    await locator.scrollIntoViewIfNeeded().catch(() => { });
    if (action === 'click') {
        try {
            await locator.click({ timeout: 8000 });
        }
        catch (clickErr) {
            // Why: form submit buttons may be briefly invisible after fill() re-renders the
            // page — pressing Enter submits the form reliably without needing the element.
            console.warn(`[AriaAction] click failed (${clickErr.message.split('\n')[0]}), falling back to Enter`);
            await page.keyboard.press('Enter');
        }
    }
    else if (action === 'type' && value !== undefined) {
        await locator.fill(value);
    }
    // Wait for any navigation or DOM update to settle after the action
    await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => { });
}
//# sourceMappingURL=playwright-mcp-adapter.js.map