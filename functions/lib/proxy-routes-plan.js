"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPlanRoute = setupPlanRoute;
const proxy_page_handler_1 = require("./proxy-page-handler");
const llm_decision_engine_1 = require("./features/llm/llm-decision.engine");
const llm_mission_planner_1 = require("./features/llm/llm-mission-planner");
const playwright_mcp_adapter_1 = require("./playwright-mcp-adapter");
const proxy_route_utils_1 = require("./proxy-route.utils");
function setupPlanRoute(app) {
    app.options('/agent/plan', (_req, res) => { (0, proxy_route_utils_1.applyCorsHeaders)(res); res.sendStatus(204); });
    // LLM mission planning — POST /agent/plan { prompt, tabId?, userId?, url?, schemaPrompt? }
    // Why: use the SAME decision engine as backend mission execution so UI and container
    // produce aligned segments/tasks (single planner version).
    app.post('/agent/plan', async (req, res) => {
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const { prompt, schemaPrompt, tabId = 'default', userId: bodyUserId, url } = req.body;
        if (!prompt)
            return res.status(400).json({ error: 'prompt required' });
        try {
            const userId = bodyUserId || req.userId || 'anonymous';
            const runtimeApiKey = req.headers['x-gemini-api-key'] || undefined;
            let domain = 'general';
            let screenshotBase64;
            let ariaSnapshot;
            try {
                const page = await (0, proxy_page_handler_1.getPersistentPage)(null, tabId, userId);
                if (page) {
                    domain = new URL(page.url() || 'http://blank').hostname;
                    ariaSnapshot = await (0, playwright_mcp_adapter_1.getAriaSnapshot)(page);
                    screenshotBase64 = (await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })).toString('base64');
                }
            }
            catch (_a) {
                if (url) {
                    try {
                        domain = new URL(url).hostname;
                    }
                    catch (_b) {
                        domain = String(url);
                    }
                }
            }
            const promptWithSchema = schemaPrompt ? `${prompt}\n\n${schemaPrompt}` : prompt;
            const missionResponse = await (0, llm_decision_engine_1.determineNextAction)(userId, promptWithSchema, [], screenshotBase64, domain, [], false, undefined, ariaSnapshot, runtimeApiKey);
            if (!missionResponse) {
                // Why: fall back to server env-key planner when no runtime key is provided
                const fallback = await (0, llm_mission_planner_1.generateLLMPlanResponse)(promptWithSchema, schemaPrompt !== null && schemaPrompt !== void 0 ? schemaPrompt : undefined);
                return res.json(fallback);
            }
            return res.json({ missionResponse });
        }
        catch (e) {
            return res.status(500).json({ error: 'Mission planning failed: ' + e.message });
        }
    });
}
//# sourceMappingURL=proxy-routes-plan.js.map