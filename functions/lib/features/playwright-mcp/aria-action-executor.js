"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAriaAction = void 0;
/** Resolve ARIA selector to Playwright locator */
const resolveLocator = (page, req) => {
    const { role, ariaName, ariaText, id } = req;
    if (role) {
        return page.getByRole(role, ariaName ? { name: ariaName, exact: false } : undefined);
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
const executeAriaAction = async (page, req) => {
    var _a;
    const locator = resolveLocator(page, req);
    if (req.action === 'click') {
        await locator.first().scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => { });
        await locator.first().click({ timeout: 8000 });
    }
    else if (req.action === 'type') {
        await locator.first().click({ timeout: 5000 });
        await locator.first().fill(req.value || '');
        if ((_a = req.value) === null || _a === void 0 ? void 0 : _a.length) {
            await page.keyboard.press('Enter');
        }
    }
    await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => { });
    return page.url();
};
exports.executeAriaAction = executeAriaAction;
//# sourceMappingURL=aria-action-executor.js.map