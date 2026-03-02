// Feature: Browser Remote Mirror | Trace: src/features/browser/hooks/use-remote-mirror-interaction.ts
/*
 * [Parent Feature/Milestone] Browser Remote Mirror
 * [Child Task/Issue] fix: wire mouse-move, scroll, and pseudo-cursor to Playwright backend
 * [Subtask] Web-only DOM event attachment with throttling and cursor tracking
 * [Upstream] Browser DOM events -> [Downstream] onMouseMove / onScroll callbacks
 * [Law Check] 48 lines | Passed Do It Check
 */
// Feature: Browser | Why: Isolated web-event logic keeps RemoteMirrorPreview under 100 lines.
// Attaches mousemove (80ms throttle) + wheel listeners on web only, tracks cursor position.
import { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export interface CursorPos { x: number; y: number }

/**
 * Attaches web-only pointer/wheel events to a container ref.
 * Returns cursorPos for rendering the pseudo-cursor dot, and containerRef to attach.
 */
export function useRemoteMirrorInteraction(
    onMouseMove?: (x: number, y: number, w: number, h: number) => void,
    onScroll?: (deltaX: number, deltaY: number) => void,
) {
    const containerRef = useRef<any>(null);
    const [cursorPos, setCursorPos] = useState<CursorPos | null>(null);
    const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (Platform.OS !== 'web' || !containerRef.current) return;
        const el = containerRef.current as HTMLElement;

        const onMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setCursorPos({ x, y });
            if (throttleRef.current || !onMouseMove) return;
            throttleRef.current = setTimeout(() => { throttleRef.current = null; }, 80);
            onMouseMove(x, y, rect.width, rect.height);
        };
        const onWheel = (e: WheelEvent) => { e.preventDefault(); onScroll?.(e.deltaX, e.deltaY); };
        const onLeave = () => setCursorPos(null);

        el.addEventListener('mousemove', onMove);
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('mouseleave', onLeave);
        return () => {
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, [onMouseMove, onScroll]);

    return { containerRef, cursorPos };
}
