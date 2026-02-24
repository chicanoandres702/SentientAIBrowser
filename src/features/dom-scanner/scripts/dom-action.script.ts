/**
 * Generates the JavaScript required to execute an action on a tagged element.
 */
export const executeDOMAction = (action: 'click' | 'type', targetId: string, value?: string) => `
  (function() {
    const el = document.querySelector('[data-ai-id="${targetId}"]');
    if (!el) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', payload: 'Element not found' }));
      return;
    }

    if ('${action}' === 'click') {
      // Simulate physical click
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.click();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', payload: 'Clicked element ${targetId}' }));
    } else if ('${action}' === 'type' && el.tagName === 'INPUT') {
      el.value = '${value}';
      // Dispatch events to trigger JS frameworks (React, Angular) to notice the text change
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', payload: 'Typed into element ${targetId}' }));
    }
    
    return true;
  })();
`;
