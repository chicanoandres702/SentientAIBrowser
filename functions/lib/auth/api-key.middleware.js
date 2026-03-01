"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyAuth = apiKeyAuth;
// Why: parse once at startup — no per-request overhead.
// Restart the container to pick up new/rotated keys.
const VALID_KEYS = new Set((process.env.PROXY_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean));
/**
 * Express middleware — validates x-api-key header or ?apiKey= query param.
 *
 * If PROXY_API_KEY is not configured, all requests pass through (dev / local mode).
 * In production, set PROXY_API_KEY to one or more comma-separated secret strings.
 *
 * Example header: x-api-key: my-secret-key-123
 * Example query:  ?apiKey=my-secret-key-123
 */
function apiKeyAuth(req, res, next) {
    // No keys configured → open access (useful for local dev)
    if (VALID_KEYS.size === 0) {
        next();
        return;
    }
    const key = req.headers['x-api-key'] || req.query.apiKey;
    if (!key || !VALID_KEYS.has(key)) {
        res.status(401).json({
            error: 'Unauthorized. Provide a valid API key via x-api-key header or ?apiKey= query param.',
        });
        return;
    }
    next();
}
//# sourceMappingURL=api-key.middleware.js.map