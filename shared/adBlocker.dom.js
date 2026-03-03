// Feature: Ad Blocker | Trace: shared/adBlocker.dom.js
// Modular DOM ad blocker for browser automation
(function() {
  const adSelectors = [
    '[id*="ad"]', '[class*="ad"]', '[id*="banner"]', '[class*="banner"]',
    '[id*="sponsor"]', '[class*="sponsor"]', '[id*="promo"]', '[class*="promo"]',
    '[id*="pop"]', '[class*="pop"]', '[id*="cookie"]', '[class*="cookie"]',
    'iframe[src*="ads"]', 'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
    'script[src*="ads"]', 'script[src*="doubleclick"]', 'script[src*="googlesyndication"]'
  ];
  function removeAds() {
    adSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.remove();
      });
    });
  }
  // Run on DOMContentLoaded and every 2 seconds for dynamic ads
  document.addEventListener('DOMContentLoaded', removeAds);
  setInterval(removeAds, 2000);
})();
