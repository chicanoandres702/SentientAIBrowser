"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectCursorAt = injectCursorAt;
/**
 * Injects (or moves) a red cursor dot into the page DOM at the center of `locator`.
 * Why: Playwright headless screenshots never show the OS cursor. This synthetic dot
 * makes every screenshot — both the LLM's reasoning screenshot and the live UI feed —
 * show exactly where the last click/type interaction occurred.
 */
async function injectCursorAt(page, locator) {
    try {
        const box = await locator.boundingBox();
        if (!box)
            return;
        const cx = Math.round(box.x + box.width / 2);
        const cy = Math.round(box.y + box.height / 2);
        await page.evaluate(({ x, y }) => {
            let el = document.getElementById('__sentient_cursor__');
            if (!el) {
                el = document.createElement('div');
                el.id = '__sentient_cursor__';
                document.body.appendChild(el);
            }
            el.style.cssText = [
                'position:fixed', `left:${x}px`, `top:${y}px`,
                'width:22px', 'height:22px', 'border-radius:50%',
                'background:rgba(220,38,38,0.82)', 'border:2.5px solid #fff',
                'box-shadow:0 0 0 1.5px rgba(0,0,0,0.45),0 2px 8px rgba(0,0,0,0.35)',
                'transform:translate(-50%,-50%)', 'pointer-events:none',
                'z-index:2147483647', 'transition:left 0.08s,top 0.08s',
            ].join(';');
        }, { x: cx, y: cy });
    }
    catch ( /* non-fatal — page may have navigated away */_a) { /* non-fatal — page may have navigated away */ }
}
//# sourceMappingURL=proxy-cursor.js.map