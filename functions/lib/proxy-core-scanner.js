"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORE_SCANNER_SCRIPT = void 0;
// Feature: DOM Scanner | Why: Real scanner injected into every proxied page via proxy-scanner.ts.
// Handles SCAN / ACTION / EXEC_SCRIPT messages from the parent app and sends DOM_MAP back.
// source:'sentient-scanner' matches HeadlessWebView handleMessage filter.
exports.CORE_SCANNER_SCRIPT = `
  // Preserve existing data-ai-id values (set by GET /proxy route) — only assign if absent.
  // This ensures IDs match what the Playwright page has, so /proxy/action selectors resolve.
  var _aiMap = [];

  function _aiVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    var r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
      s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  }

  function _aiScan() {
    _aiMap = [];
    var nextId = 1;
    var els = document.querySelectorAll(
      'button,a,input,select,textarea,[role="button"],[role="link"],[contenteditable="true"]'
    );
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!_aiVisible(el)) continue;
      // Preserve proxy-assigned id; only mint a new one if absent
      if (!el.getAttribute('data-ai-id')) el.setAttribute('data-ai-id', String(nextId));
      nextId++;
      var id = el.getAttribute('data-ai-id');
      var text = ((el.innerText || el.placeholder || el.value ||
        el.getAttribute('aria-label') || el.name || '')).trim().substring(0, 80);
      if (!text && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') continue;
      var r2 = el.getBoundingClientRect();
      _aiMap.push({
        id: id, tag: el.tagName.toLowerCase(),
        type: el.type || '', name: el.name || '', placeholder: el.placeholder || '',
        ariaLabel: el.getAttribute('aria-label') || '', text: text,
        rect: { x: Math.round(r2.left), y: Math.round(r2.top), w: Math.round(r2.width), h: Math.round(r2.height) },
        vw: window.innerWidth, vh: window.innerHeight
      });
    }
    window.parent.postMessage(
      { source: 'sentient-scanner', type: 'DOM_MAP', url: window.location.href, payload: _aiMap }, '*'
    );
  }

  // Listen for commands sent from the parent React app (HeadlessWebView)
  window.addEventListener('message', function(evt) {
    if (!evt.data || !evt.data.type) return;
    var t = evt.data.type;
    if (t === 'SCAN') { _aiScan(); return; }
    if (t === 'ACTION') {
      var el = document.querySelector('[data-ai-id="' + evt.data.id + '"]');
      if (!el) {
        window.parent.postMessage({ source: 'sentient-scanner', type: 'ERROR', payload: 'Not found: ' + evt.data.id }, '*');
        return;
      }
      if (evt.data.action === 'click') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.click();
      } else if (evt.data.action === 'type') {
        el.value = evt.data.value || '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setTimeout(_aiScan, 600);
      return;
    }
    // EXEC_SCRIPT: used by view-clearing pipeline (removes cookie banners, overlays, etc.)
    if (t === 'EXEC_SCRIPT') { try { eval(evt.data.script); } catch(e) { console.warn('[Sentient]', e); } }
  });

  // MutationObserver: re-scan after DOM settles (SPA route changes, lazy-loaded content)
  try {
    var _aiObs = new MutationObserver(function() {
      if (window._aiScanTimer) clearTimeout(window._aiScanTimer);
      window._aiScanTimer = setTimeout(_aiScan, 900);
    });
    _aiObs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch(e) {}

  // Initial scan — delay lets SPA frameworks finish first render
  setTimeout(_aiScan, 600);
  console.log('[Sentient] Scanner Active');
`;
//# sourceMappingURL=proxy-core-scanner.js.map