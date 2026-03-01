"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeStepWithRetry = executeStepWithRetry;
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const action_verifier_1 = require("./action-verifier");
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 900;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// Actions handled entirely by the caller (not routed through executeAriaAction)
const PASSTHROUGH = new Set(['done', 'wait_for_user', 'ask_user', 'record_knowledge', 'upload_file']);
/**
 * executeStepWithRetry — runs a single AriaStep up to MAX_RETRIES times.
 * Why: Playwright actions can fail transiently (animation in progress, lazy load).
 * Each attempt is followed by post-action verification so we don't mark "completed"
 * when nothing visibly changed on the page.
 */
async function executeStepWithRetry(page, step, useConfirmerAgent = true) {
    if (PASSTHROUGH.has(step.action)) {
        // Caller handles these — report success so executor proceeds normally
        return { result: 'success', observation: step.explanation, attempts: 0 };
    }
    let lastError = 'Unknown error';
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const urlBefore = page.url();
            const snapBefore = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page).catch(() => '');
            // Why: upload_file uses a different Playwright API — route it here before the ARIA path
            if (step.action === 'upload_file' && step.value) {
                const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.txt', '.docx'];
                const ext = step.value.substring(step.value.lastIndexOf('.')).toLowerCase();
                if (!allowed.includes(ext))
                    throw new Error(`File type "${ext}" not permitted`);
                await page.locator('input[type="file"]').first().setInputFiles(step.value);
                return { result: 'success', observation: step.explanation, attempts: attempt };
            }
            await (0, playwright_mcp_adapter_1.executeAriaAction)(page, step);
            // Why: always attempt captcha bypass after navigation — stealth may not be
            // sufficient and a blocked page stalls the whole mission permanently.
            if (step.action === 'navigate')
                await (0, action_verifier_1.trySolveCaptcha)(page).catch(() => { });
            // Why: when confirmer is on, give the page an extra settle window so
            // lazy-rendered content appears before we diff the ARIA snapshot.
            if (useConfirmerAgent)
                await page.waitForTimeout(300).catch(() => { });
            const verified = await (0, action_verifier_1.verifyAction)(page, step.action, urlBefore, snapBefore);
            if (verified === 'verified') {
                return { result: 'success', observation: step.explanation, attempts: attempt };
            }
            // Action ran without exception but had no visible effect — retry
            lastError = 'Action had no observable page effect';
            console.warn(`[StepExecutor] Attempt ${attempt}/${MAX_RETRIES} unverified — ${step.action}: ${lastError}`);
        }
        catch (err) {
            lastError = err.message;
            console.warn(`[StepExecutor] Attempt ${attempt}/${MAX_RETRIES} threw — ${step.action}: ${lastError}`);
        }
        if (attempt < MAX_RETRIES)
            await sleep(RETRY_DELAY_MS);
    }
    return {
        result: 'failure',
        observation: `Failed after ${MAX_RETRIES} attempts: ${lastError}`,
        attempts: MAX_RETRIES,
    };
}
//# sourceMappingURL=step-executor.js.map