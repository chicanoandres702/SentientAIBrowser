// Feature: Browser | Why: 5-stage DOM cleanup pipeline — from web-ui-1's clear_view + JS_PURIFY_DOM
// Injects JS into the WebView to remove overlays, banners, and distractions before action execution

/** Stage 1: Dismiss Google Vignette interstitial ads */
export const JS_CLOSE_VIGNETTE = `
(function() {
    try {
        var vignette = document.querySelector('[id*="google_vignette"], [class*="google-vignette"]');
        if (vignette) { vignette.remove(); return 'removed_vignette'; }
        var dismiss = document.querySelector('[id*="dismiss"], .google-vignette-dismiss');
        if (dismiss) { dismiss.click(); return 'clicked_dismiss'; }
    } catch(e) {}
    return 'no_vignette';
})()`;

/** Stage 2: Close cookie consent banners (with Shadow DOM traversal) */
export const JS_CLOSE_COOKIE_BANNERS = `
(function() {
    var removed = 0;
    function deepQuery(root, sel) {
        var results = Array.from(root.querySelectorAll(sel));
        root.querySelectorAll('*').forEach(function(el) {
            if (el.shadowRoot) results = results.concat(deepQuery(el.shadowRoot, sel));
        });
        return results;
    }
    var bannerSels = '[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], [class*="gdpr"]';
    var banners = deepQuery(document, bannerSels);
    banners.forEach(function(b) { b.remove(); removed++; });
    var acceptBtns = deepQuery(document, 'button');
    acceptBtns.forEach(function(btn) {
        var t = btn.textContent.toLowerCase();
        if (t.includes('accept') || t.includes('agree') || t.includes('got it') || t.includes('ok')) {
            btn.click(); removed++;
        }
    });
    return removed;
})()`;

/** Stage 3: Remove fixed/sticky overlays and modals */
export const JS_REMOVE_OVERLAYS = `
(function() {
    var removed = 0;
    document.querySelectorAll('*').forEach(function(el) {
        var s = getComputedStyle(el);
        if ((s.position === 'fixed' || s.position === 'sticky') && s.zIndex > 999) {
            var area = el.offsetWidth * el.offsetHeight;
            var screenArea = window.innerWidth * window.innerHeight;
            if (area > screenArea * 0.3) { el.remove(); removed++; }
        }
    });
    return removed;
})()`;

/** Stage 4: Remove ad elements and newsletter popups */
export const JS_REMOVE_ADS = `
(function() {
    var sels = [
        '[class*="ad-"]', '[id*="ad-"]', '[class*="advert"]',
        'iframe[src*="ads"]', 'iframe[src*="doubleclick"]',
        '[class*="newsletter"]', '[class*="popup"]', '[class*="subscribe"]',
        '[class*="notification-bar"]', '[class*="promo-banner"]'
    ];
    var removed = 0;
    sels.forEach(function(sel) {
        document.querySelectorAll(sel).forEach(function(el) { el.remove(); removed++; });
    });
    return removed;
})()`;

/** Stage 5: Detect navigation blockers (CAPTCHA, login, install prompts) */
export const JS_DETECT_BLOCKERS = `
(function() {
    var signals = [];
    if (document.querySelector('iframe[src*="recaptcha"], iframe[src*="captcha"]'))
        signals.push('CAPTCHA');
    if (document.querySelector('[class*="login"], [id*="login"], form[action*="login"]'))
        signals.push('LOGIN_FORM');
    if (document.querySelector('[class*="install-app"], [class*="app-banner"]'))
        signals.push('INSTALL_PROMPT');
    if (document.querySelector('[class*="age-gate"], [class*="age-verify"]'))
        signals.push('AGE_GATE');
    if (document.querySelector('[class*="wizard"], [class*="stepper"]'))
        signals.push('WIZARD');
    if (document.querySelector('.pagination, nav[aria-label*="page"]'))
        signals.push('PAGINATION');
    return signals;
})()`;

/** All 5 stages in execution order */
export const VIEW_CLEARING_STAGES = [
    { name: 'vignette', script: JS_CLOSE_VIGNETTE },
    { name: 'cookies', script: JS_CLOSE_COOKIE_BANNERS },
    { name: 'overlays', script: JS_REMOVE_OVERLAYS },
    { name: 'ads', script: JS_REMOVE_ADS },
    { name: 'detect', script: JS_DETECT_BLOCKERS },
] as const;
