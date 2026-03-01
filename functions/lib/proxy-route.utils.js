"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePage = exports.applyCorsHeaders = void 0;
const proxy_page_handler_1 = require("./proxy-page-handler");
const applyCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
};
exports.applyCorsHeaders = applyCorsHeaders;
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