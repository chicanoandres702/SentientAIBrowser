// Feature: External API | Why: Protect external-facing routes from unauthorized Chromium access.
// Keys are stored in PROXY_API_KEY env var as a comma-separated list — easy to rotate without code changes.
import { Request, Response, NextFunction } from 'express';

// Why: parse once at startup — no per-request overhead.
// Restart the container to pick up new/rotated keys.
const VALID_KEYS = new Set(
    (process.env.PROXY_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean)
);

/**
 * Express middleware — validates x-api-key header or ?apiKey= query param.
 *
 * If PROXY_API_KEY is not configured, all requests pass through (dev / local mode).
 * In production, set PROXY_API_KEY to one or more comma-separated secret strings.
 *
 * Example header: x-api-key: my-secret-key-123
 * Example query:  ?apiKey=my-secret-key-123
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
    // No keys configured → open access (useful for local dev)
    if (VALID_KEYS.size === 0) { next(); return; }

    const key = (req.headers['x-api-key'] as string) || (req.query.apiKey as string);
    if (!key || !VALID_KEYS.has(key)) {
        res.status(401).json({
            error: 'Unauthorized. Provide a valid API key via x-api-key header or ?apiKey= query param.',
        });
        return;
    }
    next();
}
