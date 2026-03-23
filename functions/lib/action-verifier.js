"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAction = verifyAction;
exports.isCaptchaPage = isCaptchaPage;
exports.trySolveCaptcha = trySolveCaptcha;
// Nav/interaction actions — verify by URL or ARIA change
const NAV_ACTIONS = new Set(['navigate', 'click', 'submit', 'select_option', 'press_key']);
// Input actions — no DOM diff expected, just assume verified if no exception thrown
const INPUT_ACTIONS = new Set(['type', 'fill', 'clear_and_type', 'scroll', 'hover', 'wait']);
// Always-verified actions handled upstream
const PASSTHROUGH = new Set(['done', 'wait_for_user', 'ask_user', 'record_knowledge', 'upload_file']);
/** Post-action check: did the page visibly react? Returns 'verified' on observable change. */
async function verifyAction(page, actionType, urlBefore, snapBefore) {
    if (PASSTHROUGH.has(actionType))
        return 'verified';
    if (INPUT_ACTIONS.has(actionType))
        return 'verified';
    try {
        // Why: brief settle time so browser finishes rendering before we diff
        await page.waitForTimeout(500);
        const urlAfter = page.url();
        if (urlAfter !== urlBefore)
            return 'verified';
        // Lightweight ARIA diff — use ariaSnapshot (same as getAriaSnapshot) to detect DOM mutations
        const snapAfter = await page.ariaSnapshot().catch(() => '');
        if (snapAfter && snapAfter !== snapBefore)
            return 'verified';
        // NAV actions with no observable change — flag for retry
        if (NAV_ACTIONS.has(actionType))
            return 'unverified';
        return 'verified';
    }
    catch (_a) {
        return 'unverified';
    }
}
// Why: duplicated from proxy-nav-controller to avoid cross-process imports
const CAPTCHA_PAT = [
    /google\.com\/sorry/, /recaptcha/, /hcaptcha\.com/,
    /\/captcha\//, /\/challenge\//, /cloudflare\.com\/challenge/,
];
function isCaptchaPage(url) {
    return CAPTCHA_PAT.some(p => p.test(url));
}
/**
 * trySolveCaptcha: attempts to auto-dismiss checkbox-style captchas.
 * Why: reCaptcha/hCaptcha checkbox flows can be clicked programmatically;
 * this gives the mission one automated attempt before stalling.
 */
async function trySolveCaptcha(page) {
    if (!isCaptchaPage(page.url()))
        return false;
    try {
        // iframe-hosted captcha (reCaptcha / hCaptcha)
        for (const f of page.frames()) {
            if (/recaptcha|hcaptcha/.test(f.url())) {
                await f.click('[class*="checkbox"], .recaptcha-checkbox, [id="checkbox"]', { timeout: 2000 }).catch(() => { });
                await page.waitForTimeout(1800);
                return !isCaptchaPage(page.url()); // true = resolved
            }
        }
        // Inline captcha on the main page
        await page.click('[class*="captcha-checkbox"], [id*="captcha"] button, [id*="captcha-submit"]', { timeout: 2000 }).catch(() => { });
        return true;
    }
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=action-verifier.js.map