// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] HeadlessWebView message handler
 * [Subtask] Platform-agnostic message passing for headless WebView
 * [Upstream] iframe/WebView events -> [Downstream] DOM scanner callbacks
 * [Law Check] 42 lines | Passed 100-Line Law
 */

export interface MessagePayload {
  source: string;
  type: 'DOM_MAP' | 'NEW_TAB' | 'ACTION' | 'SCAN' | 'EXEC_SCRIPT';
  payload?: unknown;
  action?: 'click' | 'type';
  id?: string;
  value?: string;
  script?: string;
}

export const createHeadlessMessageHandler = (
  onDomMapReceived: (map: unknown) => void,
  onNewTabRequested: (url: string) => void
) => {
  const handleMessage = (event: MessageEvent) => {
    if (!event.data || event.data.source !== 'sentient-scanner') return;
    const { type, payload } = event.data;
    if (type === 'DOM_MAP') onDomMapReceived(payload);
    else if (type === 'NEW_TAB') {
      const cleanUrl = payload.startsWith('http://localhost:3000/proxy?url=')
        ? decodeURIComponent(payload.split('url=')[1])
        : payload;
      onNewTabRequested(cleanUrl);
    }
  };

  return { handleMessage };
};

export const createWebViewActions = (
  iframeRef: React.RefObject<HTMLIFrameElement>,
  webViewRef: React.RefObject<any>,
  isWeb: boolean
) => ({
  scanDOM: () => {
    if (isWeb) {
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'sentient-parent', type: 'SCAN' },
        '*'
      );
    } else {
      webViewRef.current?.injectJavaScript('window._runAIScan && window._runAIScan(); true;');
    }
  },
  executeAction: (action: 'click' | 'type', id: string, value?: string, script?: string) => {
    if (isWeb) {
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'sentient-parent', type: 'ACTION', action, id, value },
        '*'
      );
    } else if (script) {
      webViewRef.current?.injectJavaScript(script);
    }
  },
  reload: () => {
    if (isWeb && iframeRef.current) {
      // eslint-disable-next-line no-self-assign -- intentional: forces iframe reload without full re-mount
      iframeRef.current.src = iframeRef.current.src;
    } else {
      webViewRef.current?.reload();
    }
  },
  injectJavaScript: (script: string) => {
    if (isWeb) {
      iframeRef.current?.contentWindow?.postMessage(
        { source: 'sentient-parent', type: 'EXEC_SCRIPT', script },
        '*'
      );
    } else {
      webViewRef.current?.injectJavaScript(`${script}; true;`);
    }
  },
});
