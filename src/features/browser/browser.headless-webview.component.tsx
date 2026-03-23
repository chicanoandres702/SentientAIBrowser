// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Headless WebView component
 * [Subtask] Bridge between React Native WebView and Web iframe for DOM scanning
 * [Upstream] React Native -> [Downstream] DOM scanner script injection
 * [Law Check] 98 lines | Passed 100-Line Law
 */

import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getAIDomScannerScript } from '@features/dom-scanner/scripts/native-scanner.script';
import { createHeadlessMessageHandler, createWebViewActions } from './browser.headless-webview.handler';
import { headlessStyles, iframeStyles } from './browser.headless-webview.styles';

interface Props {
  isVisible: boolean;
  url: string;
  useProxy?: boolean;
  onDomMapReceived: (map: unknown) => void;
  onNewTabRequested: (url: string) => void;
}

export interface HeadlessWebViewRef {
  scanDOM: () => void;
  executeAction: (action: 'click' | 'type', id: string, value?: string) => void;
  reload: () => void;
  injectJavaScript: (script: string) => void;
}

export const HeadlessWebView = React.memo(
  forwardRef<HeadlessWebViewRef, Props>(
    ({ isVisible, url, onDomMapReceived, onNewTabRequested }, ref) => {
      const webViewRef = useRef<WebView>(null);
      const iframeRef = useRef<HTMLIFrameElement>(null);
      const isWeb = Platform.OS === 'web';
      const { handleMessage } = createHeadlessMessageHandler(onDomMapReceived, onNewTabRequested);

      useEffect(() => {
        if (!isWeb) return;
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
      }, [handleMessage, isWeb]);

      useImperativeHandle(ref, () =>
        createWebViewActions(iframeRef as React.RefObject<HTMLIFrameElement>, webViewRef, isWeb)
      );

      return (
        <View style={isVisible ? headlessStyles.visibleContainer : headlessStyles.hiddenContainer}>
          {isWeb ? (
            <iframe
              ref={iframeRef as unknown as React.Ref<HTMLIFrameElement>}
              src={url}
              style={iframeStyles as unknown as React.CSSProperties}
              title="AI View"
            />
          ) : (
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              injectedJavaScript={getAIDomScannerScript()}
              onMessage={(e) => {
                const data = JSON.parse(e.nativeEvent.data);
                if (data.type === 'DOM_MAP') onDomMapReceived(data.payload);
              }}
              javaScriptEnabled
              domStorageEnabled
            />
          )}
        </View>
      );
    }
  )
);

HeadlessWebView.displayName = 'HeadlessWebView';
