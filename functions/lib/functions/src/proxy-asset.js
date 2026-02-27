"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOCKED_EXTENSIONS = exports.BLOCKED_RESOURCE_TYPES = exports.STATIC_ASSET_EXTENSIONS = void 0;
exports.isStaticAsset = isStaticAsset;
exports.setupAssetRoute = setupAssetRoute;
exports.STATIC_ASSET_EXTENSIONS = [
    '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.map'
];
exports.BLOCKED_RESOURCE_TYPES = ['image', 'font', 'stylesheet', 'media', 'other'];
exports.BLOCKED_EXTENSIONS = [
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm'
];
function isStaticAsset(url) {
    try {
        const path = new URL(url).pathname;
        return exports.STATIC_ASSET_EXTENSIONS.some(ext => path.endsWith(ext));
    }
    catch (_a) {
        return false;
    }
}
function setupAssetRoute(app) {
    app.get('/proxy/asset', async (req, res) => {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).send('URL parameter required for asset proxy.');
        }
        try {
            const fetch = (await Promise.resolve(`${'node-fetch'}`).then(s => __importStar(require(s)))).default;
            const response = await fetch(targetUrl, { headers: { 'User-Agent': req.headers['user-agent'] || '' } });
            response.headers.forEach((value, name) => {
                res.setHeader(name, value);
            });
            response.body.pipe(res);
        }
        catch (error) {
            res.status(500).send(`Failed to fetch asset: ${error.message}`);
        }
    });
}
//# sourceMappingURL=proxy-asset.js.map