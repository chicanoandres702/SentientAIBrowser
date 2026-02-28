// Feature: Browser | Why: Route handlers for proxy action + screenshot — keeps routes file under 100 lines
import { Express } from 'express';
import { getPersistentPage, activePages } from './proxy-page-handler';

/** POST /proxy/action — execute click/type on a persistent page */
export function setupActionRoute(app: Express) {
    app.post('/proxy/action', async (req, res): Promise<any> => {
        const { url, action, id, value, tabId = 'default' } = req.body;
        let page = activePages.get(tabId) || await getPersistentPage(url, tabId).catch(() => null);
        if (!page) return res.status(500).json({ error: 'Session died' });
        try {
            const sel = `[data-ai-id="${id}"]`;
            if (action === 'click') {
                await page.evaluate((s) => { const e = document.querySelector(s) as HTMLElement; if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } }, sel);
            } else if (action === 'type') {
                const el = await page.$(sel); if (!el) throw new Error('Not found'); await el.focus();
                await page.evaluate((s) => { (document.querySelector(s) as HTMLInputElement).value = ''; }, sel);
                await el.type(value || '', { delay: 10 });
                await page.evaluate(s => { const e = document.querySelector(s); ['input', 'change'].forEach(t => e?.dispatchEvent(new Event(t, { bubbles: true }))); }, sel);
                if (value?.length) await page.keyboard.press('Enter');
            }
            res.json({ success: true });
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    });
}

/** GET /screenshot — capture current page as base64 jpeg */
export function setupScreenshotRoute(app: Express) {
    app.get('/screenshot', async (req, res) => {
        try {
            const tabId = (req.query.tabId as string) || 'default';
            let page = activePages.get(tabId);
            if (!page && req.query.url) page = await getPersistentPage(req.query.url as string, tabId);
            if (!page) throw new Error('No active page for this tab');
            const buf = await page.screenshot({ quality: 70, type: 'jpeg' });
            res.json({ screenshot: `data:image/jpeg;base64,${buf.toString('base64')}` });
        } catch (e: any) { res.status(500).json({ error: e.message }); }
    });
}
