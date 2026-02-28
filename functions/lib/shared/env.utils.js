"use strict";
// Feature: Core | Trace: README.md
// Backend-compatible env utils (no react-native dependency)
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvConfig = void 0;
/**
 * Utility to identify the current environment and provide appropriate configuration.
 * Backend version — runs in Node.js (Cloud Run / local proxy), not React Native.
 */
const getEnvConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        isProduction,
        proxyBaseUrl: 'http://localhost:' + (process.env.PORT || '3000'),
        isWeb: false,
        isNative: false
    };
};
exports.getEnvConfig = getEnvConfig;
//# sourceMappingURL=env.utils.js.map