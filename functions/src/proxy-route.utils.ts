// Feature: Browser | Why: Shared helpers for proxy routes and CORS
import { Response, Request } from 'express';
import { getPersistentPage, activePages } from './proxy-page-handler';

export const applyCorsHeaders = (res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-Gemini-Api-Key');
    res.setHeader('Vary', 'Origin');
};

/**
 * Extract Firebase UID from request.
 * Why: routes that create browser contexts need the real userId so sessions are saved/restored.
 * Reads body.userId first; falls back to decoding the Bearer JWT payload (no verification —
 * internal Cloud Run trust model). Returns 'default' if neither is available.
 */
export const getUserIdFromReq = (req: Request): string => {
    if (req.body?.userId && req.body.userId !== 'default') return req.body.userId;
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const payload = JSON.parse(Buffer.from(authHeader.split('.')[1], 'base64url').toString());
            const uid = payload.user_id || payload.sub;
            if (uid && uid !== 'anonymous') return uid;
        } catch {}
    }
    return 'default';
};

export const resolvePage = async (tabId: string, url?: string) => {
    let page = activePages.get(tabId);
    if (page && page.isClosed()) {
        activePages.delete(tabId);
        page = undefined as any;
    }
    if (!page && url) {
        try {
            page = await getPersistentPage(url, tabId);
        } catch {
            page = null as any;
        }
    }
    return page || null;
};
