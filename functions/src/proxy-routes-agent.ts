// Feature: Agent | Why: POST /agent/analyze — core LLM decision route for DOM map analysis
import { Express } from 'express';
import { applyCorsHeaders } from './proxy-route.utils';
import { determineNextAction } from './features/llm/llm-decision.engine';

// Why: These keywords signal an auth gate so the frontend can show the BlockedUserModal
const LOGIN_KEYWORDS = /login|sign.?in|password|auth|mfa|captcha/i;

/** Detects if the first LLM step is a login/auth gate */
const isLoginGate = (execution: any): boolean => {
    const firstStep = execution?.segments?.[0]?.steps?.[0];
    return firstStep?.action === 'wait_for_user' && LOGIN_KEYWORDS.test(firstStep?.explanation || '');
};

/** Safely extract hostname for domain context */
const extractDomain = (url: string): string => {
    try { return new URL(url).hostname; } catch { return url; }
};

/**
 * POST /agent/analyze
 * Body: { prompt, url, domMap, lookedUpDocs?, isScholarMode? }
 * Returns: { isLoginPage, blockedReason?, execution?, meta }
 * Why: The frontend decision loop needs a single cloud endpoint to submit the current
 * DOM map + goal and receive the next atomic action chain from Gemini.
 */
export function setupAgentAnalyzeRoute(app: Express): void {
    // Pre-flight handler so CORS headers are present on OPTIONS before POST
    app.options('/agent/analyze', (_req, res) => {
        applyCorsHeaders(res);
        res.sendStatus(204);
    });

    app.post('/agent/analyze', async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        try {
            const { prompt, url, domMap, lookedUpDocs = [], isScholarMode = false } = req.body;

            if (!prompt || !url) {
                return res.status(400).json({ error: 'prompt and url are required' });
            }

            const domain = extractDomain(url);
            // Why: userId scopes LLM memory — falls back to 'anonymous' when token is absent
            const userId = (req as any).userId || 'anonymous';
            const runtimeApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

            const result = await determineNextAction(
                userId, prompt, domMap || [], undefined, domain, lookedUpDocs, isScholarMode, undefined, undefined, runtimeApiKey,
            );

            if (!result) return res.status(502).json({ error: 'LLM returned no result' });

            const loginPage = isLoginGate(result.execution);
            const firstStep = result.execution?.segments?.[0]?.steps?.[0];

            return res.json({
                isLoginPage: loginPage,
                blockedReason: loginPage
                    ? (firstStep?.explanation || 'A security wall (Login) has been detected.')
                    : undefined,
                execution: loginPage ? undefined : result.execution,
                meta: result.meta,
            });
        } catch (e: any) {
            console.error('[/agent/analyze] Error:', e.message);
            return res.status(500).json({ error: e.message });
        }
    });
}
