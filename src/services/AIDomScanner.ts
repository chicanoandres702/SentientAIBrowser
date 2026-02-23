/**
 * This script is injected directly into the React Native WebView.
 * It traverses the DOM, finds interactable elements, tags them with numeric IDs,
 * and sends a minified JSON representation of the page back to React Native.
 */
export const getAIDomScannerScript = () => `
  (function() {
    let elementMap = [];
    let currentId = 1;

    function isVisible(el) {
      if (!el || el.nodeType !== 1) return false;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.opacity !== '0'
      );
    }

    function scanDOM() {
      elementMap = [];
      // Grab all potentially interactable elements
      const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
      
      elements.forEach(el => {
        if (isVisible(el)) {
          // Tag the element
          el.setAttribute('data-ai-id', currentId.toString());
          
          // Extract meaningful text for the LLM
          let text = el.innerText || el.placeholder || el.value || el.getAttribute('aria-label') || el.name || '';
          text = text.trim();
          
          // Only map if there is something identifying about it
          // OR if it's an input field
          if (text || el.tagName === 'INPUT') {
            elementMap.push({
              id: currentId,
              tag: el.tagName.toLowerCase(),
              type: el.type || undefined,
              text: text.substring(0, 50) // Limit text length to save tokens
            });
            currentId++;
          }
        }
      });

      // Send the map back to the React Native App
      window.ReactNativeWebView.postMessage(JSON.stringify({ 
        type: 'DOM_MAP', 
        url: window.location.href,
        payload: elementMap 
      }));
    }

    // Run the initial scan
    scanDOM();
    
    // Watcher: Use MutationObserver to detect real-time DOM changes
    // This allows the AI to react instantly to loading bars finishing, 
    // new popups appearing, or dynamic content changes without polling.
    const observer = new MutationObserver((mutations) => {
      // Debounce the scan to avoid spamming during heavy page loads
      if (window._scanTimeout) clearTimeout(window._scanTimeout);
      window._scanTimeout = setTimeout(() => {
        console.log('DOM Watcher: Change detected, re-scanning...');
        scanDOM();
      }, 1000); 
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: false 
    });

    window._runAIScan = scanDOM;

    return true;
  })();
`;

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
