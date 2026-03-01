// Feature: External API | Why: Clean, auth-protected endpoints for external callers.
// Unlike /proxy, these routes return raw content — no link rewriting, no scanner injection.
import { Express } from 'express';
import { getPersistentPage } from './proxy-page-handler';
import { apiKeyAuth } from './auth/api-key.middleware';
import { applyCorsHeaders } from './proxy-route.utils';
import { stripSecurityHeaders } from './proxy-config';

const IDLE_TIMEOUT_MS = 15000;

/** Navigate to URL and wait for networkidle — shared warm-up for both routes */
async function warmPage(url: string, tabId: string) {
    const page = await getPersistentPage(url, tabId);
    if (!page) throw new Error('Failed to load page');
    await page.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT_MS }).catch(() => {});
    return page;
}

/**
 * GET /api/render?url=...&tabId=...
 * Returns fully JS-rendered HTML with NO link rewriting or scanner injection.
 * Suitable for external scrapers, AI pipelines, and server-to-server integrations.
 */
function setupRenderRoute(app: Express) {
    app.get('/api/render', apiKeyAuth, async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { url, tabId = 'external' } = req.query as { url?: string; tabId?: string };
        if (!url) return res.status(400).json({ error: 'url param required' });
        try {
            const page = await warmPage(url, tabId);
            const html = await page.content();
            stripSecurityHeaders(res);
            res.set('Content-Type', 'text/html').send(html);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });
}

/**
 * GET /api/extract?url=...&tabId=...
 * Returns structured JSON: { url, title, text, links[], elements[] }
 * Ideal for LLM pipelines, AI agents, and structured data extraction.
 * links: up to 200 anchor hrefs + text.
 * elements: all visible interactive elements with data-ai-id for action targeting.
 * text: inner text of the page body (up to 50k chars) for context windows.
 */
function setupExtractRoute(app: Express) {
    app.get('/api/extract', apiKeyAuth, async (req, res): Promise<any> => {
        applyCorsHeaders(res);
        const { url, tabId = 'extract' } = req.query as { url?: string; tabId?: string };
        if (!url) return res.status(400).json({ error: 'url param required' });
        try {
            const page = await warmPage(url, tabId);
            const data = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
                    .map(a => ({ text: a.textContent?.trim() || '', href: a.href }))
                    .filter(l => l.href.startsWith('http'))
                    .slice(0, 200);
                const elements = Array.from(
                    document.querySelectorAll('button,input,select,textarea,[role="button"]')
                )
                    .filter(el => {
                        const r = (el as HTMLElement).getBoundingClientRect();
                        return r.width > 0 && r.height > 0;
                    })
                    .map((el, i) => {
                        el.setAttribute('data-ai-id', String(i + 1));
                        return {
                            id: i + 1,
                            tag: el.tagName.toLowerCase(),
                            text: (el as HTMLElement).innerText?.trim().slice(0, 120) || '',
                            type: (el as HTMLInputElement).type || null,
                        };
                    });
                return {
                    url: window.location.href,
                    title: document.title,
                    text: document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 50000),
                    links,
                    elements,
                };
            });
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    });
}

export function setupExternalRoutes(app: Express) {
    setupRenderRoute(app);
    setupExtractRoute(app);
}
