// Feature: Browser | Why: Shared helpers for proxy routes and CORS
import { Response } from 'express';
import { getPersistentPage, activePages } from './proxy-page-handler';

export const applyCorsHeaders = (res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
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
