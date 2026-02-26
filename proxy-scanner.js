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
    var els = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"]'
    );
    els.forEach(function(el) {
      if (isVisible(el)) {
        var existingId = el.getAttribute('data-ai-id');
        if (existingId) {
          var text = el.innerText || el.placeholder || el.value || el.getAttribute('aria-label') || el.name || '';
          text = text.trim();
          if (text || el.tagName === 'INPUT') {
            elementMap.push({
              id: existingId.toString(),
              tag: el.tagName.toLowerCase(),
              type: el.type || undefined,
              text: text.substring(0, 50)
            });
          }
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
    // The action is now forwarded to the backend proxy
    var params = new URLSearchParams(window.location.search);
    var tabId = params.get('tabId') || 'default';
    
    fetch('/proxy/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabId: tabId, action: action, id: targetId, value: value })
    }).then(r => r.json()).then(res => {
      if (res.success) {
        window.parent.postMessage({ source: 'sentient-scanner', type: 'SUCCESS', payload: 'Executed on backend: ' + targetId }, '*');
        setTimeout(() => location.reload(), 1500); // Reload iframe to fetch new backend state
      } else {
        window.parent.postMessage({ source: 'sentient-scanner', type: 'ERROR', payload: 'Backend execution failed: ' + res.error }, '*');
      }
    }).catch(err => {
      window.parent.postMessage({ source: 'sentient-scanner', type: 'ERROR', payload: err.message }, '*');
    });
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

  var originalReplaceState = history.replaceState;
  var originalPushState = history.pushState;
  history.replaceState = function() { try { return originalReplaceState.apply(this, arguments); } catch(e) {} };
  history.pushState = function() { try { return originalPushState.apply(this, arguments); } catch(e) {} };

  var originalFetch = window.fetch;
  window.fetch = async function() {
    var args = Array.prototype.slice.call(arguments);
    var url = args[0];
    if (url && typeof url.toString === 'function' && !(url instanceof Request)) url = url.toString();
    
    if (typeof url === 'string' && url.indexOf('http://localhost') !== 0 && url.indexOf('/') !== 0) {
      try {
        var absUrl = new URL(url, window.location.origin).href;
        if (absUrl.indexOf('http') === 0 && absUrl.indexOf('http://localhost') !== 0) {
           args[0] = 'http://localhost:3000/proxy/forward?url=' + encodeURIComponent(absUrl);
        }
      } catch (e) {}
    } else if (typeof url === 'string' && url.indexOf('/') === 0 && url.indexOf('//') !== 0) {
       // Root-relative URL: need to construct against originally injected <base> or URL
       try {
           var base = document.querySelector('base') ? document.querySelector('base').href : window.location.origin;
           var absUrl = new URL(url, base).href;
           args[0] = 'http://localhost:3000/proxy/forward?url=' + encodeURIComponent(absUrl);
       } catch (e) {}
    } else if (url instanceof Request && url.url.indexOf('http://localhost') !== 0) {
      try {
        var base = document.querySelector('base') ? document.querySelector('base').href : window.location.origin;
        var absUrl = new URL(url.url, base).href;
        if (absUrl.indexOf('http') === 0 && absUrl.indexOf('http://localhost') !== 0) {
           args[0] = new Request('http://localhost:3000/proxy/forward?url=' + encodeURIComponent(absUrl), url);
        }
      } catch (e) {}
    }
    return originalFetch.apply(this, args);
  };

  var originalXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url) {
    if (url && typeof url.toString === 'function') url = url.toString();
    var rest = Array.prototype.slice.call(arguments, 2);
    if (typeof url === 'string' && url.indexOf('http://localhost') !== 0 && url.indexOf('/') !== 0) {
      try {
        var absUrl = new URL(url, window.location.origin).href;
        if (absUrl.indexOf('http') === 0 && absUrl.indexOf('http://localhost') !== 0) {
           url = 'http://localhost:3000/proxy/forward?url=' + encodeURIComponent(absUrl);
        }
      } catch (e) {}
    } else if (typeof url === 'string' && url.indexOf('/') === 0 && url.indexOf('//') !== 0) {
      try {
        var base = document.querySelector('base') ? document.querySelector('base').href : window.location.origin;
        var absUrl = new URL(url, base).href;
        url = 'http://localhost:3000/proxy/forward?url=' + encodeURIComponent(absUrl);
      } catch (e) {}
    } else if (typeof url === 'string' && url.indexOf('//') === 0) { // Protocol-relative URLs
      try {
         var absUrl = 'https:' + url;
         url = 'http://localhost:3000/proxy/forward?url=' + encodeURIComponent(absUrl);
      } catch (e) {}
    }

    return originalXHR.apply(this, [method, url].concat(rest));
  };

})();
</script>`;

function injectScanner(html) {
  // Inject early into <head> so we can override XHR/fetch BEFORE page scripts cache them
  if (html.includes('<head>')) {
    return html.replace('<head>', '<head>' + SCANNER_SCRIPT);
  } else if (html.includes('<html>')) {
    return html.replace('<html>', '<html><head>' + SCANNER_SCRIPT + '</head>');
  }
  return SCANNER_SCRIPT + html;
}

module.exports = { injectScanner };
