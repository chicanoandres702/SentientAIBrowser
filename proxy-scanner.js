// Feature: System Utilities | Trace: README.md
const SCANNER_SCRIPT = `
<script>
(function() {
  var elementMap = [];
  var currentId = 1;

  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    var rect = el.getBoundingClientRect();
    var style = window.getComputedStyle(el);
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
    var els = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"]'
    );
    els.forEach(function(el) {
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
      source: 'sentient-scanner',
      type: 'DOM_MAP',
      url: window.location.href,
      payload: elementMap
    }, '*');
  }

  function executeAction(action, targetId, value) {
    var el = document.querySelector('[data-ai-id="' + targetId + '"]');
    if (!el) {
      window.parent.postMessage({ source: 'sentient-scanner', type: 'ERROR', payload: 'Element not found' }, '*');
      return;
    }
    if (action === 'click') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.click();
      window.parent.postMessage({ source: 'sentient-scanner', type: 'SUCCESS', payload: 'Clicked ' + targetId }, '*');
    } else if (action === 'type') {
      el.value = value || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      window.parent.postMessage({ source: 'sentient-scanner', type: 'SUCCESS', payload: 'Typed ' + targetId }, '*');
    }
    setTimeout(scanDOM, 500);
  }

  window.addEventListener('message', function(event) {
    if (!event.data || event.data.source !== 'sentient-parent') return;
    if (event.data.type === 'SCAN') scanDOM();
    if (event.data.type === 'ACTION') {
      executeAction(event.data.action, event.data.id, event.data.value);
    }
  });

  var observer = new MutationObserver(function() {
    if (window._scanTimeout) clearTimeout(window._scanTimeout);
    window._scanTimeout = setTimeout(function() {
      scanDOM();
    }, 1500);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window._runAIScan = scanDOM;
  setTimeout(scanDOM, 2000);

  // --- POPUP INTERCEPTION ---
  window.open = function(url) {
    if (url) {
        window.parent.postMessage({ source: 'sentient-scanner', type: 'NEW_TAB', payload: url }, '*');
    }
    return null;
  };

  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a && a.href) {
        if (a.target === '_blank' || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            window.parent.postMessage({ source: 'sentient-scanner', type: 'NEW_TAB', payload: a.href }, '*');
        }
    }
  }, true);
})();
</script>`;

function injectScanner(html) {
  if (html.includes('</body>')) {
    return html.replace('</body>', SCANNER_SCRIPT + '</body>');
  }
  return html + SCANNER_SCRIPT;
}

module.exports = { injectScanner };
