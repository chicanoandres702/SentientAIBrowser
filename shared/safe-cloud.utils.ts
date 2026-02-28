// Feature: Core | Trace: README.md
/**
 * Sanitizes data before it is sent to a cloud database (e.g., Firestore).
 * Ensures that sensitive information like passwords, credit card numbers, 
 * or private keys are redacted to prevent accidental exposure.
 */

const SENSITIVE_KEYS = [
    'password',
    'pass',
    'secret',
    'key',
    'token',
    'credit_card',
    'cvv',
    'ssn',
    'credential'
];

const SENSITIVE_PATTERNS = [
    // Generic email pattern
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Potential API keys (basic entropy check or prefix)
    /AIza[0-9A-Za-z-_]{35}/g,
];

export const sanitizeForCloud = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
        let sanitized = data;
        SENSITIVE_PATTERNS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED]');
        });
        return sanitized;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeForCloud(item));
    }

    if (typeof data === 'object') {
        const sanitizedObj: any = {};
        for (const key in data) {
            if (data[key] === undefined) continue;
            const lowerKey = key.toLowerCase();
            if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
                sanitizedObj[key] = '[REDACTED_SENSITIVE_KEY]';
            } else {
                sanitizedObj[key] = sanitizeForCloud(data[key]);
            }
        }
        return sanitizedObj;
    }

    return data;
};
