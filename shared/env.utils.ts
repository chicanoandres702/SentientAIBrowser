// Feature: Core | Trace: README.md
import { Platform } from 'react-native';

/**
 * Utility to identify the current environment and provide appropriate configuration.
 */
export const getEnvConfig = () => {
    const isFirebaseHosted = typeof window !== 'undefined' &&
        (window.location.hostname.includes('firebaseapp.com') ||
         window.location.hostname.includes('web.app'));

    // Production proxy on Cloud Run (Playwright + Chromium)
    const productionProxy = 'https://sentient-proxy-184717935920.us-central1.run.app';

    // Why: Playwright/Chromium only runs on Cloud Run — there is no local equivalent for web.
    // Use the Cloud Run proxy for ALL web builds (localhost dev included).
    // Local proxy address is only relevant for Android/iOS native where a local server can be
    // started alongside the simulator.
    const localProxy = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

    const isProduction = isFirebaseHosted || Platform.OS === 'web';

    return {
        isProduction,
        proxyBaseUrl: isProduction ? productionProxy : localProxy,
        isWeb: Platform.OS === 'web',
        isNative: Platform.OS !== 'web'
    };
};
