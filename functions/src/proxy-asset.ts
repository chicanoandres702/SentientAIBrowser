// Feature: System Utilities | Trace: proxy-fetch.route.ts
import { Express, Request, Response } from 'express';

export const STATIC_ASSET_EXTENSIONS = [
    '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.map'
];

export const BLOCKED_RESOURCE_TYPES = ['image', 'font', 'stylesheet', 'media', 'other'];

export const BLOCKED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm'
];

export function isStaticAsset(url: string): boolean {
    try {
        const pathname = new URL(url).pathname;
        return STATIC_ASSET_EXTENSIONS.some(ext => pathname.endsWith(ext));
    } catch {
        return false;
    }
}

/**
 * Stream a static asset directly to the response — no Playwright involved.
 * Used by both the legacy /proxy/asset route and the new proxy-fetch wildcard route.
 */
export async function proxyAsset(targetUrl: string, req: Request, res: Response): Promise<void> {
    try {
        const fetch = (await import('node-fetch' as any)).default;
        const upstream = await fetch(targetUrl, {
            headers: { 'User-Agent': req.headers['user-agent'] || '' },
        });
        upstream.headers.forEach((value: string, name: string) => res.setHeader(name, value));
        upstream.body.pipe(res);
    } catch (error: any) {
        res.status(500).send(`Asset fetch failed: ${error.message}`);
    }
}

/** Legacy Express route — kept for backward compat with /proxy/asset?url= callers */
export function setupAssetRoute(app: Express) {
    app.get('/proxy/asset', async (req, res): Promise<any> => {
        const targetUrl = req.query.url as string;
        if (!targetUrl) return res.status(400).send('url param required');
        return proxyAsset(targetUrl, req, res);
    });
}