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
    onNewTabRequested: (url: string) => void;
}

export interface HeadlessWebViewRef {
    scanDOM: () => void;
    executeAction: (action: 'click' | 'type', id: string, value?: string) => void;
    reload: () => void;
}

import { headlessStyles, iframeStyles } from './HeadlessWebView.styles';

export const HeadlessWebView = React.memo(forwardRef<HeadlessWebViewRef, Props>(({ isVisible, url, useProxy, onDomMapReceived, onNewTabRequested }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const displayUrl = (Platform.OS === 'web' && useProxy && url)
        ? `http://localhost:3000/proxy?url=${encodeURIComponent(url)}`
        : url;

    const handleMessage = useCallback((event: MessageEvent) => {
        if (!event.data || event.data.source !== 'sentient-scanner') return;
        const { type, payload } = event.data;
        if (type === 'DOM_MAP') onDomMapReceived(payload);
        else if (type === 'NEW_TAB') {
            const cleanUrl = payload.startsWith('http://localhost:3000/proxy?url=') 
                ? decodeURIComponent(payload.split('url=')[1]) : payload;
            onNewTabRequested(cleanUrl);
        }
    }, [onDomMapReceived, onNewTabRequested]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    useImperativeHandle(ref, () => ({
        scanDOM: () => {
            if (Platform.OS === 'web') iframeRef.current?.contentWindow?.postMessage({ source: 'sentient-parent', type: 'SCAN' }, '*');
            else webViewRef.current?.injectJavaScript(`window._runAIScan && window._runAIScan(); true;`);
        },
        executeAction: (action, id, value) => {
            if (Platform.OS === 'web') iframeRef.current?.contentWindow?.postMessage({ source: 'sentient-parent', type: 'ACTION', action, id, value }, '*');
            else webViewRef.current?.injectJavaScript(executeDOMAction(action, id, value));
        },
        reload: () => {
            if (Platform.OS === 'web') {
                if (iframeRef.current) iframeRef.current.src = iframeRef.current.src; // Force reload iframe
            } else {
                webViewRef.current?.reload();
            }
        }
    }));

    return (
        <View style={isVisible ? headlessStyles.visibleContainer : headlessStyles.hiddenContainer}>
            {Platform.OS === 'web' ? (
                <iframe ref={iframeRef as any} src={displayUrl} style={iframeStyles as any} title="AI View" />
            ) : (
                <WebView ref={webViewRef} source={{ uri: url }} injectedJavaScript={getAIDomScannerScript()}
                    onMessage={(e) => {
                        const data = JSON.parse(e.nativeEvent.data);
                        if (data.type === 'DOM_MAP') onDomMapReceived(data.payload);
                    }}
                    javaScriptEnabled domStorageEnabled />
            )}
        </View>
    );
}));
