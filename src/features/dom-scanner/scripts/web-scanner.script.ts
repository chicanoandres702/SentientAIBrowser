// Feature: DOM Scanner | Trace: README.md
/**
 * Web-compatible scanner for iframe injection via proxy.
 * Uses window.parent.postMessage instead of ReactNativeWebView.
 * Also listens for commands (SCAN, ACTION) from the parent.
 */
export const getWebScannerScript = (): string => `
<script>
(function() {
  let elementMap = [];
  let currentId = 1;

  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 && rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      style.opacity !== '0'
    );
  }

  function scanDOM() {
    elementMap = [];
    currentId = 1;
    const elements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"]'
    );
    elements.forEach(function(el) {
      if (isVisible(el)) {
        el.setAttribute('data-ai-id', currentId.toString());
        var text = el.innerText || el.placeholder || el.value
          || el.getAttribute('aria-label') || el.name || '';
        text = text.trim();
        if (text || el.tagName === 'INPUT') {
          elementMap.push({
            id: currentId,
            tag: el.tagName.toLowerCase(),
            type: el.type || undefined,
            text: text.substring(0, 50)
          });
          currentId++;
        }
      }
    });
    window.parent.postMessage({
      type: 'DOM_MAP',
      url: window.location.href,
      payload: elementMap
    }, '*');
  }

  function executeAction(action, targetId, value) {
    var el = document.querySelector('[data-ai-id="' + targetId + '"]');
    if (!el) {
      window.parent.postMessage({ type: 'ERROR', payload: 'Element not found' }, '*');
      return;
    }
    if (action === 'click') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.click();
      window.parent.postMessage({ type: 'SUCCESS', payload: 'Clicked ' + targetId }, '*');
    } else if (action === 'type') {
      el.value = value || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.parent.postMessage({ type: 'SUCCESS', payload: 'Typed ' + targetId }, '*');
    }
    // Re-scan after action to get updated DOM
    setTimeout(scanDOM, 500);
  }

  // Listen for commands from parent app
  window.addEventListener('message', function(event) {
    if (!event.data || !event.data.type) return;
    if (event.data.type === 'SCAN') scanDOM();
    if (event.data.type === 'ACTION') {
      executeAction(event.data.action, event.data.id, event.data.value);
    }
  });

  // MutationObserver for real-time DOM change detection
  var observer = new MutationObserver(function() {
    if (window._scanTimeout) clearTimeout(window._scanTimeout);
    window._scanTimeout = setTimeout(function() {
      console.log('DOM Watcher: Change detected, re-scanning...');
      scanDOM();
    }, 1000);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window._runAIScan = scanDOM;

  // Initial scan after short delay to let page settle
  setTimeout(scanDOM, 1500);
})();
</script>`;
