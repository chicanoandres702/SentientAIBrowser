// Feature: DOM Scanner | Trace: README.md
// Why: iframe/web version — same aria-hidden + shadow DOM logic as native scanner.
export const getWebScannerScript = (): string => `
<script>
(function() {
  var ATTR = 'data-ai-id';
  var SELECTOR = [
    'button:not([disabled])','a[href]',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])','textarea:not([disabled])',
    '[role="button"]:not([aria-disabled="true"])',
    '[role="link"]','[role="checkbox"]','[role="radio"]',
    '[role="menuitem"]','[role="tab"]','[role="combobox"]',
    '[contenteditable="true"]'
  ].join(',');

  function isAriaHidden(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') return true;
      node = node.parentElement;
    }
    return false;
  }

  function isVisible(el) {
    var r = el.getBoundingClientRect(), s = window.getComputedStyle(el);
    return r.width > 0 && r.height > 0 &&
      s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  }

  function collectFromRoot(root, out) {
    root.querySelectorAll(SELECTOR).forEach(function(el) { out.push(el); });
    root.querySelectorAll('*').forEach(function(el) {
      if (el.shadowRoot) collectFromRoot(el.shadowRoot, out);
    });
  }

  function getLabel(el) {
    var lblId = el.getAttribute('aria-labelledby');
    var lblEl  = lblId && document.getElementById(lblId);
    return ((el.getAttribute('aria-label') || (lblEl && lblEl.innerText) ||
      el.getAttribute('title') || el.getAttribute('placeholder') ||
      (el.innerText || '').trim() || el.value || el.getAttribute('name')) || '')
      .trim().substring(0, 80);
  }

  function getRole(el) {
    var r = el.getAttribute('role'); if (r) return r;
    var tag = el.tagName.toLowerCase(), t = (el.type || '').toLowerCase();
    if (tag === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (tag === 'select') return 'combobox';
    if (tag === 'textarea' || el.isContentEditable) return 'textbox';
    if (tag === 'input') {
      if (t === 'checkbox') return 'checkbox';
      if (t === 'radio') return 'radio';
      if (t === 'submit' || t === 'button') return 'button';
      return 'textbox';
    }
    return tag;
  }

  function post(obj) { window.parent.postMessage(Object.assign({ source: 'sentient-scanner' }, obj), '*'); }

  function scanDOM() {
    document.querySelectorAll('['+ATTR+']').forEach(function(el){ el.removeAttribute(ATTR); });
    var all = []; collectFromRoot(document, all);
    var map = [], id = 1, viewH = window.innerHeight;
    all.forEach(function(el) {
      if (!isVisible(el) || isAriaHidden(el)) return;
      var label = getLabel(el), role = getRole(el);
      if (!label && role !== 'textbox' && role !== 'combobox') return;
      el.setAttribute(ATTR, String(id));
      var rect = el.getBoundingClientRect();
      var node = { id: id, role: role, label: label,
        inViewport: rect.top < viewH && rect.bottom > 0,
        focused: el === document.activeElement };
      if (el.checked !== undefined) node.checked = el.checked;
      if (el.value && role === 'textbox') node.value = el.value.substring(0, 60);
      if (role === 'combobox' && el.selectedOptions && el.selectedOptions[0])
        node.selectedOption = el.selectedOptions[0].text.trim().substring(0, 40);
      map.push(node); id++;
    });
    post({ type: 'DOM_MAP', url: window.location.href, payload: map });
  }

  function executeAction(action, targetId, value) {
    var el = document.querySelector('['+ATTR+'="'+targetId+'"]');
    if (!el) { post({ type: 'ERROR', payload: 'Element not found: '+targetId }); return; }
    if (action === 'click') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); el.click();
      post({ type: 'SUCCESS', payload: 'Clicked '+targetId });
    } else if (action === 'type') {
      el.focus(); el.value = value || '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      post({ type: 'SUCCESS', payload: 'Typed into '+targetId });
    }
    setTimeout(scanDOM, 500);
  }

  window.addEventListener('message', function(e) {
    if (!e.data || e.data.source !== 'sentient-parent') return;
    if (e.data.type === 'SCAN') scanDOM();
    if (e.data.type === 'ACTION') executeAction(e.data.action, e.data.id, e.data.value);
  });

  new MutationObserver(function() {
    clearTimeout(window._scanTimeout);
    window._scanTimeout = setTimeout(scanDOM, 800);
  }).observe(document.body, { childList: true, subtree: true });

  window._runAIScan = scanDOM;
  setTimeout(scanDOM, 1200);
})();
</script>`;
