// Feature: Core | Trace: README.md
import { Platform } from 'react-native';

/**
 * Utility to identify the current environment and provide appropriate configuration.
 */
export const getEnvConfig = () => {
    // Why: check the actual hostname so local dev (localhost / 127.0.0.1) correctly
    // uses the local proxy, while hosted builds (Firebase / web.app) hit Cloud Run.
    // The previous check `|| Platform.OS === 'web'` was always true on web and caused
    // local dev to always hit Cloud Run — making run-web.ps1's local proxy unreachable.
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isFirebaseHosted = hostname.includes('firebaseapp.com') || hostname.includes('web.app');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';

    // Production proxy on Cloud Run (Playwright + Chromium)
    const productionProxy = 'https://sentient-proxy-184717935920.us-central1.run.app';

    // Why: Android emulator maps 10.0.2.2 → host machine localhost.
    // iOS sim and web local dev both reach the local proxy via localhost.
    const localProxy = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

    // Why: native apps always use local proxy (no window.location);
    //      web uses local proxy only when running on localhost (dev server),
    //      and Cloud Run for any publicly hosted build.
    const isProduction = Platform.OS === 'web' ? isFirebaseHosted && !isLocalhost : false;

    return {
        isProduction,
        proxyBaseUrl: isProduction ? productionProxy : (Platform.OS === 'web' && !isLocalhost ? productionProxy : localProxy),
        isWeb: Platform.OS === 'web',
        isNative: Platform.OS !== 'web',
    };
};
