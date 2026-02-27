// Feature: System Utilities | Trace: proxy-routes-browser.js
import { Express } from 'express';

export const STATIC_ASSET_EXTENSIONS = [
    '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.map'
];

export const BLOCKED_RESOURCE_TYPES = ['image', 'font', 'stylesheet', 'media', 'other'];

export const BLOCKED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm'
];

export function isStaticAsset(url: string): boolean {
    try {
        const path = new URL(url).pathname;
        return STATIC_ASSET_EXTENSIONS.some(ext => path.endsWith(ext));
    } catch {
        return false;
    }
}

export function setupAssetRoute(app: Express) {
    app.get('/proxy/asset', async (req, res): Promise<any> => {
        const targetUrl = req.query.url as string;
        if (!targetUrl) {
            return res.status(400).send('URL parameter required for asset proxy.');
        }

        try {
            const fetch = (await import('node-fetch' as any)).default;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': req.headers['user-agent'] || '' } });

            response.headers.forEach((value: string, name: string) => {
                res.setHeader(name, value);
            });

            response.body.pipe(res);
        } catch (error: any) {
            res.status(500).send(`Failed to fetch asset: ${error.message}`);
        }
    });
}