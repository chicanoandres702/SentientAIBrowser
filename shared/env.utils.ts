// Feature: Core | Trace: README.md
import { Platform } from 'react-native';

/**
 * Utility to identify the current environment and provide appropriate configuration.
 */
export const getEnvConfig = () => {
    // Check if running on a production-like host or localhost
    const isProduction = typeof window !== 'undefined' && 
                        (window.location.hostname.includes('firebaseapp.com') || 
                         window.location.hostname.includes('web.app'));

    // Local dev proxy defaults
    const localProxy = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
    
    // In production, the proxy can be a dedicated service or a Cloud Function.
    // Assuming for now a standard sub-domain or relative path if hosted together.
    const productionProxy = 'https://proxy.sentient-ai-browser.web.app'; 

    return {
        isProduction,
        proxyBaseUrl: isProduction ? productionProxy : localProxy,
        isWeb: Platform.OS === 'web',
        isNative: Platform.OS !== 'web'
    };
};
