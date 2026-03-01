"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDomMap = void 0;
const buildDomMap = async (page, fallbackUrl) => {
    return page.evaluate((url) => {
        const isVisible = (el) => {
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
        };
        let id = 1;
        const nodes = Array.from(document.querySelectorAll('button,a,input,select,textarea,[role="button"],[role="link"],[contenteditable="true"]'))
            .filter(isVisible)
            .map((el) => {
            var _a;
            if (!el.getAttribute('data-ai-id'))
                el.setAttribute('data-ai-id', String(id++));
            const r = el.getBoundingClientRect();
            return {
                id: el.getAttribute('data-ai-id') || '',
                tag: el.tagName.toLowerCase(),
                text: ((_a = el.innerText) === null || _a === void 0 ? void 0 : _a.slice(0, 120)) || '',
                type: el.type || '',
                name: el.name || '',
                placeholder: el.placeholder || '',
                ariaLabel: el.getAttribute('aria-label') || '',
                rect: { x: r.x, y: r.y, w: r.width, h: r.height },
            };
        });
        return { map: nodes, viewport: { vw: window.innerWidth, vh: window.innerHeight }, url: window.location.href || url };
    }, fallbackUrl);
};
exports.buildDomMap = buildDomMap;
//# sourceMappingURL=proxy-dom-map.js.map