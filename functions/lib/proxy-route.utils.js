"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePage = exports.getUserIdFromReq = exports.applyCorsHeaders = void 0;
const proxy_page_handler_1 = require("./proxy-page-handler");
const applyCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-Gemini-Api-Key');
    res.setHeader('Vary', 'Origin');
};
exports.applyCorsHeaders = applyCorsHeaders;
/**
 * Extract Firebase UID from request.
 * Why: routes that create browser contexts need the real userId so sessions are saved/restored.
 * Reads body.userId first; falls back to decoding the Bearer JWT payload (no verification —
 * internal Cloud Run trust model). Returns 'default' if neither is available.
 */
const getUserIdFromReq = (req) => {
    var _a, _b;
    if (((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) && req.body.userId !== 'default')
        return req.body.userId;
    const authHeader = (_b = req.headers) === null || _b === void 0 ? void 0 : _b.authorization;
    if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) {
        try {
            const payload = JSON.parse(Buffer.from(authHeader.split('.')[1], 'base64url').toString());
            const uid = payload.user_id || payload.sub;
            if (uid && uid !== 'anonymous')
                return uid;
        }
        catch (_c) { }
    }
    return 'default';
};
exports.getUserIdFromReq = getUserIdFromReq;
const resolvePage = async (tabId, url) => {
    let page = proxy_page_handler_1.activePages.get(tabId);
    if (page && page.isClosed()) {
        proxy_page_handler_1.activePages.delete(tabId);
        page = undefined;
    }
    if (!page && url) {
        try {
            page = await (0, proxy_page_handler_1.getPersistentPage)(url, tabId);
        }
        catch (_a) {
            page = null;
        }
    }
    return page || null;
};
exports.resolvePage = resolvePage;
//# sourceMappingURL=proxy-route.utils.js.map