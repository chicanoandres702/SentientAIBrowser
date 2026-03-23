"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupScreenshotStreamRoute = setupScreenshotStreamRoute;
const proxy_route_utils_1 = require("./proxy-route.utils");
const proxy_tab_sync_broker_1 = require("./proxy-tab-sync.broker");
function setupScreenshotStreamRoute(app) {
    const STREAM_INTERVAL_MS = 300;
    app.get('/screenshot/stream', async (req, res) => {
        var _a;
        const tabId = req.query.tabId || 'default';
        const url = req.query.url;
        (0, proxy_route_utils_1.applyCorsHeaders)(res);
        const page = await (0, proxy_route_utils_1.resolvePage)(tabId, url);
        if (!page) {
            res.status(url ? 503 : 404).end();
            return;
        }
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        (_a = res.flushHeaders) === null || _a === void 0 ? void 0 : _a.call(res);
        const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 15000);
        const timer = setInterval(async () => {
            try {
                if (page.isClosed())
                    throw new Error('Session closed');
                const cached = (0, proxy_tab_sync_broker_1.getCachedFrame)(tabId);
                const frameData = (cached && (Date.now() - cached.ts) < 600)
                    ? cached.data
                    : `data:image/jpeg;base64,${(await page.screenshot({ quality: 60, type: 'jpeg', timeout: 4000, fullPage: false })).toString('base64')}`;
                res.write(`data: ${frameData}\n\n`);
            }
            catch (e) {
                res.write(`event: error\ndata: ${e.message}\n\n`);
            }
        }, STREAM_INTERVAL_MS);
        req.on('close', () => { clearInterval(timer); clearInterval(heartbeat); });
    });
}
//# sourceMappingURL=proxy-route.screenshot-stream.js.map