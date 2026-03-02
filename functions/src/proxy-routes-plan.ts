// Feature: LLM Plan Route | Trace: README.md
import { Express } from 'express';
import { getPersistentPage } from './proxy-page-handler';
import { determineNextAction } from './features/llm/llm-decision.engine';
import { generateLLMPlanResponse } from './features/llm/llm-mission-planner';
import { getAriaSnapshot } from './playwright-mcp-adapter';
import { applyCorsHeaders } from './proxy-route.utils';

export function setupPlanRoute(app: Express): void {
    app.options('/agent/plan', (_req, res) => { applyCorsHeaders(res); res.sendStatus(204); });

    // LLM mission planning — POST /agent/plan { prompt, tabId?, userId?, url?, schemaPrompt? }
    // Why: use the SAME decision engine as backend mission execution so UI and container
    // produce aligned segments/tasks (single planner version).
    app.post('/agent/plan', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { prompt, schemaPrompt, tabId = 'default', userId: bodyUserId, url } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        try {
            const userId = bodyUserId || (req as any).userId || 'anonymous';
            const runtimeApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;
            let domain = 'general';
            let screenshotBase64: string | undefined;
            let ariaSnapshot: string | undefined;
            try {
                const page = await getPersistentPage(null, tabId, userId);
                if (page) {
                    domain = new URL(page.url() || 'http://blank').hostname;
                    ariaSnapshot = await getAriaSnapshot(page);
                    screenshotBase64 = (await page.screenshot({ quality: 30, type: 'jpeg', timeout: 8000 })).toString('base64');
                }
            } catch {
                if (url) { try { domain = new URL(url).hostname; } catch { domain = String(url); } }
            }
            const promptWithSchema = schemaPrompt ? `${prompt}\n\n${schemaPrompt}` : prompt;
            const missionResponse = await determineNextAction(
                userId, promptWithSchema, [], screenshotBase64, domain, [], false, undefined, ariaSnapshot, runtimeApiKey,
            );
            if (!missionResponse) {
                // Why: fall back to server env-key planner when no runtime key is provided
                const fallback = await generateLLMPlanResponse(promptWithSchema, schemaPrompt ?? undefined);
                return res.json(fallback);
            }
            return res.json({ missionResponse });
        } catch (e: unknown) {
            return res.status(500).json({ error: 'Mission planning failed: ' + (e as Error).message });
        }
    });
}
