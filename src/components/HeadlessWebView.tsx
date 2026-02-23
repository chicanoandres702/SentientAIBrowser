import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getAIDomScannerScript, executeDOMAction } from '../services/AIDomScanner';

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

export const HeadlessWebView = forwardRef<HeadlessWebViewRef, Props>(({ isVisible, url, useProxy, onDomMapReceived }, ref) => {
    const webViewRef = useRef<WebView>(null);

    // Some sites block being in an iframe. A local proxy can help bypass X-Frame-Options.
    const displayUrl = (Platform.OS === 'web' && useProxy && url)
        ? `http://localhost:3000/proxy?url=${encodeURIComponent(url)}`
        : url;

    useImperativeHandle(ref, () => ({
        scanDOM: () => {
            webViewRef.current?.injectJavaScript(`window._runAIScan && window._runAIScan(); true;`);
        },
        executeAction: (action, id, value) => {
            webViewRef.current?.injectJavaScript(executeDOMAction(action, id, value));
        }
    }));

    return (
        <View style={isVisible ? styles.visibleContainer : styles.hiddenContainer}>
            {Platform.OS === 'web' ? (
                <iframe
                    src={displayUrl}
                    style={{ flex: 1, width: '100%', height: '100%', border: 'none' }}
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
                        if (data.type === 'DOM_MAP') {
                            onDomMapReceived(data.payload);
                        }
                    }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36"
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    visibleContainer: {
        flex: 1,
    },
    hiddenContainer: {
        height: 0,
        width: 0,
        opacity: 0,
        display: 'none',
    },
});
