// Feature: UI | Trace: README.md
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getAIDomScannerScript } from '../features/dom-scanner/scripts/native-scanner.script';
import { executeDOMAction } from '../features/dom-scanner/scripts/dom-action.script';

interface Props {
    isVisible: boolean;
    url: string;
    useProxy?: boolean;
    onDomMapReceived: (map: any) => void;
}

export interface HeadlessWebViewRef {
    scanDOM: () => void;
    executeAction: (action: 'click' | 'type', id: string, value?: string) => void;
}

export const HeadlessWebView = React.memo(forwardRef<HeadlessWebViewRef, Props>(({ isVisible, url, useProxy, onDomMapReceived }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const displayUrl = (Platform.OS === 'web' && useProxy && url)
        ? `http://localhost:3000/proxy?url=${encodeURIComponent(url)}`
        : url;

    // Listen for postMessage from iframe (web only)
    const handleMessage = useCallback((event: MessageEvent) => {
        if (!event.data || event.data.source !== 'sentient-scanner') return;
        if (event.data.type === 'DOM_MAP') {
            console.log('[HeadlessWebView] DOM_MAP received:', event.data.payload?.length, 'nodes');
            onDomMapReceived(event.data.payload);
        } else if (event.data.type === 'ERROR') {
            console.warn('[HeadlessWebView] Scanner error:', event.data.payload);
        } else if (event.data.type === 'SUCCESS') {
            console.log('[HeadlessWebView] Action success:', event.data.payload);
        }
    }, [onDomMapReceived]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    useImperativeHandle(ref, () => ({
        scanDOM: () => {
            if (Platform.OS === 'web') {
                // Send SCAN command to iframe via postMessage
                iframeRef.current?.contentWindow?.postMessage(
                    { source: 'sentient-parent', type: 'SCAN' }, '*'
                );
            } else {
                webViewRef.current?.injectJavaScript(
                    `window._runAIScan && window._runAIScan(); true;`
                );
            }
        },
        executeAction: (action, id, value) => {
            if (Platform.OS === 'web') {
                iframeRef.current?.contentWindow?.postMessage(
                    { source: 'sentient-parent', type: 'ACTION', action, id, value }, '*'
                );
            } else {
                webViewRef.current?.injectJavaScript(executeDOMAction(action, id, value));
            }
        }
    }));

    return (
        <View style={isVisible ? styles.visibleContainer : styles.hiddenContainer}>
            {Platform.OS === 'web' ? (
                <iframe
                    ref={iframeRef as any}
                    src={displayUrl}
                    style={iframeStyles}
                    title="Sentient AI Browser Web View"
                />
            ) : (
                <WebView
                    ref={webViewRef}
                    source={{ uri: url }}
                    injectedJavaScript={getAIDomScannerScript()}
                    onMessage={(event) => {
                        const data = JSON.parse(event.nativeEvent.data);
                        console.log('WebView Message Type:', data.type);
                        if (data.type === 'DOM_MAP') onDomMapReceived(data.payload);
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36"
                />
            )}
        </View>
    );
}));

const iframeStyles = {
    flex: 1, width: '100%', height: '100%',
    border: 'none', backgroundColor: '#000', minHeight: '100%',
};

const styles = StyleSheet.create({
    visibleContainer: { flex: 1, backgroundColor: '#050505' },
    hiddenContainer: { height: 0, width: 0, opacity: 0, display: 'none' },
});
