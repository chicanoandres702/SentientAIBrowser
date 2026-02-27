"use strict";
// Feature: Core | Trace: README.md
/**
 * Sanitizes data before it is sent to a cloud database (e.g., Firestore).
 * Ensures that sensitive information like passwords, credit card numbers,
 * or private keys are redacted to prevent accidental exposure.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeForCloud = void 0;
const SENSITIVE_KEYS = [
    'password',
    'pass',
    'secret',
    'key',
    'token',
    'credit_card',
    'cvv',
    'ssn',
    'credential',
    'auth'
];
const SENSITIVE_PATTERNS = [
    // Generic email pattern
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Potential API keys (basic entropy check or prefix)
    /AIza[0-9A-Za-z-_]{35}/g,
];
const sanitizeForCloud = (data) => {
    if (data === null || data === undefined)
        return data;
    if (typeof data === 'string') {
        let sanitized = data;
        SENSITIVE_PATTERNS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
        });
        return sanitized;
    }
    if (Array.isArray(data)) {
        return data.map(item => (0, exports.sanitizeForCloud)(item));
    }
    if (typeof data === 'object') {
        const sanitizedObj = {};
        for (const key in data) {
            const lowerKey = key.toLowerCase();
            if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
                sanitizedObj[key] = '[REDACTED_SENSITIVE_KEY]';
            }
            else {
                sanitizedObj[key] = (0, exports.sanitizeForCloud)(data[key]);
            }
        }
        return sanitizedObj;
    }
    return data;
};
exports.sanitizeForCloud = sanitizeForCloud;
//# sourceMappingURL=safe-cloud.utils.js.map