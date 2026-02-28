// Feature: Browser | Why: On-demand DOM map extraction for remote control
import { Page } from 'playwright';

interface DomMapResult {
    map: Array<Record<string, unknown>>;
    viewport: { vw: number; vh: number };
    url: string;
}

export const buildDomMap = async (page: Page, fallbackUrl: string): Promise<DomMapResult> => {
    return page.evaluate((url) => {
        const isVisible = (el: Element) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            const s = window.getComputedStyle(el as HTMLElement);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
        };
        let id = 1;
        const nodes = Array.from(document.querySelectorAll('button,a,input,select,textarea,[role="button"],[role="link"],[contenteditable="true"]'))
            .filter(isVisible)
            .map((el) => {
                if (!el.getAttribute('data-ai-id')) el.setAttribute('data-ai-id', String(id++));
                const r = (el as HTMLElement).getBoundingClientRect();
                return {
                    id: el.getAttribute('data-ai-id') || '',
                    tag: el.tagName.toLowerCase(),
                    text: (el as HTMLElement).innerText?.slice(0, 120) || '',
                    type: (el as HTMLInputElement).type || '',
                    name: (el as HTMLInputElement).name || '',
                    placeholder: (el as HTMLInputElement).placeholder || '',
                    ariaLabel: el.getAttribute('aria-label') || '',
                    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
                };
            });
        return { map: nodes, viewport: { vw: window.innerWidth, vh: window.innerHeight }, url: window.location.href || url };
    }, fallbackUrl);
};
