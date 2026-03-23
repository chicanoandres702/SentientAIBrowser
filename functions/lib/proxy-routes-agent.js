"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAgentAnalyzeRoute = setupAgentAnalyzeRoute;
const proxy_route_utils_1 = require("./proxy-route.utils");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
// Why: These keywords signal an auth gate so the frontend can show the BlockedUserModal
const LOGIN_KEYWORDS = /login|sign.?in|password|auth|mfa|captcha/i;
/** Detects if the first LLM step is a login/auth gate */
const isLoginGate = (execution) => {
    var _a, _b, _c;
    const firstStep = (_c = (_b = (_a = execution === null || execution === void 0 ? void 0 : execution.segments) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.steps) === null || _c === void 0 ? void 0 : _c[0];
    return (firstStep === null || firstStep === void 0 ? void 0 : firstStep.action) === 'wait_for_user' && LOGIN_KEYWORDS.test((firstStep === null || firstStep === void 0 ? void 0 : firstStep.explanation) || '');
};
/** Safely extract hostname for domain context */
const extractDomain = (url) => {
    try {
        return new URL(url).hostname;
    }
    catch (_a) {
        return url;
    }
};
/**
 * POST /agent/analyze
 * Body: { prompt, url, domMap, lookedUpDocs?, isScholarMode? }
 * Returns: { isLoginPage, blockedReason?, execution?, meta }
 * Why: The frontend decision loop needs a single cloud endpoint to submit the current
 * DOM map + goal and receive the next atomic action chain from Gemini.
 */
function setupAgentAnalyzeRoute(app) {
    // Pre-flight handler so CORS headers are present on OPTIONS before POST
    app.options('/agent/analyze', (_req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        res.sendStatus(204);
    });
    app.post('/agent/analyze', async (req, res) => {
        var _a, _b, _c, _d;
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        try {
            const { prompt, url, domMap, lookedUpDocs = [], isScholarMode = false } = req.body;
            if (!prompt || !url) {
                return res.status(400).json({ error: 'prompt and url are required' });
            }
            const domain = extractDomain(url);
            // Why: userId scopes LLM memory — falls back to 'anonymous' when token is absent
            const userId = req.userId || 'anonymous';
            const runtimeApiKey = req.headers['x-gemini-api-key'] || undefined;
            const result = await (0, llm_decision_engine_1.determineNextAction)(userId, prompt, domMap || [], undefined, domain, lookedUpDocs, isScholarMode, undefined, undefined, runtimeApiKey);
            if (!result)
                return res.status(502).json({ error: 'LLM returned no result' });
            const loginPage = isLoginGate(result.execution);
            const firstStep = (_d = (_c = (_b = (_a = result.execution) === null || _a === void 0 ? void 0 : _a.segments) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.steps) === null || _d === void 0 ? void 0 : _d[0];
            return res.json({
                isLoginPage: loginPage,
                blockedReason: loginPage
                    ? ((firstStep === null || firstStep === void 0 ? void 0 : firstStep.explanation) || 'A security wall (Login) has been detected.')
                    : undefined,
                execution: loginPage ? undefined : result.execution,
                meta: result.meta,
            });
        }
        catch (e) {
            console.error('[/agent/analyze] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-agent.js.map