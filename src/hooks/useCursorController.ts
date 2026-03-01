// Feature: Core | Why: Manages virtual cursor state + animation sequencing
// Looks up element rects from the latest DOM map to position the cursor
import { useState, useCallback, useRef } from 'react';

/** DOM element with rect data from scanner */
export interface DomElement {
    id: number;
    tag: string;
    type?: string;
    text: string;
    rect?: { x: number; y: number; w: number; h: number };
    vw?: number;
    vh?: number;
}

/** Current cursor visual state — consumed by VirtualCursor component */
export interface CursorState {
    x: number;
    y: number;
    visible: boolean;
    effect: 'idle' | 'click' | 'type' | 'move';
    effectKey: number;
}

/** Timing constants for cursor animation sequencing */
const MOVE_DURATION_MS = 350;
const CLICK_HOLD_MS = 300;
const TYPE_HOLD_MS = 600;

/**
 * useCursorController: Manages the pseudo-cursor lifecycle.
 * Stores the latest DOM map, resolves target coordinates,
 * and sequences move → click/type animations.
 */
export const useCursorController = (
    containerWidth: number,
    containerHeight: number,
) => {
    const [cursor, setCursor] = useState<CursorState>({
        x: 0, y: 0, visible: false, effect: 'idle', effectKey: 0,
    });
    const domMapRef = useRef<DomElement[]>([]);
    const keyRef = useRef(0);

    /** Store the latest DOM map — called on every scan */
    const updateDomMap = useCallback((map: DomElement[]) => {
        domMapRef.current = Array.isArray(map) ? map : [];
    }, []);

    /** Resolve an element's center position in container-relative pixels */
    const resolvePosition = useCallback((targetId: string): { x: number; y: number } | null => {
        const id = parseInt(targetId, 10);
        const el = domMapRef.current.find(e => e.id === id);
        if (!el?.rect || !el.vw || !el.vh) return null;

        // Scale from page coordinates to container coordinates
        const scaleX = containerWidth / el.vw;
        const scaleY = containerHeight / el.vh;

        return {
            x: (el.rect.x + el.rect.w / 2) * scaleX,
            y: (el.rect.y + el.rect.h / 2) * scaleY,
        };
    }, [containerWidth, containerHeight]);

    /** Animate cursor to target, then trigger click effect. Returns a promise that resolves when done. */
    const animateClick = useCallback(async (targetId: string): Promise<boolean> => {
        const pos = resolvePosition(targetId);
        if (!pos) return false;

        keyRef.current++;
        const key = keyRef.current;

        // Phase 1: Move to target
        setCursor({ x: pos.x, y: pos.y, visible: true, effect: 'move', effectKey: key });
        await sleep(MOVE_DURATION_MS);

        // Phase 2: Click pulse
        setCursor({ x: pos.x, y: pos.y, visible: true, effect: 'click', effectKey: key + 1 });
        await sleep(CLICK_HOLD_MS);

        // Phase 3: Back to idle
        setCursor(prev => ({ ...prev, effect: 'idle', effectKey: key + 2 }));
        return true;
    }, [resolvePosition]);

    /** Animate cursor to target, then trigger type caret effect */
    const animateType = useCallback(async (targetId: string): Promise<boolean> => {
        const pos = resolvePosition(targetId);
        if (!pos) return false;

        keyRef.current++;
        const key = keyRef.current;

        // Phase 1: Move to field
        setCursor({ x: pos.x, y: pos.y, visible: true, effect: 'move', effectKey: key });
        await sleep(MOVE_DURATION_MS);

        // Phase 2: Type caret blink
        setCursor({ x: pos.x, y: pos.y, visible: true, effect: 'type', effectKey: key + 1 });
        await sleep(TYPE_HOLD_MS);

        // Phase 3: Back to idle
        setCursor(prev => ({ ...prev, effect: 'idle', effectKey: key + 2 }));
        return true;
    }, [resolvePosition]);

    /** Hide cursor completely */
    const hideCursor = useCallback(() => {
        setCursor(prev => ({ ...prev, visible: false, effect: 'idle' }));
    }, []);

    /** Show cursor at a given position without effect */
    const showAt = useCallback((x: number, y: number) => {
        keyRef.current++;
        setCursor({ x, y, visible: true, effect: 'idle', effectKey: keyRef.current });
    }, []);

    /** Animate a click at raw container pixel coordinates — for manual user interactions */
    const clickAt = useCallback(async (x: number, y: number): Promise<void> => {
        keyRef.current++;
        const key = keyRef.current;
        setCursor({ x, y, visible: true, effect: 'move', effectKey: key });
        await sleep(150);
        setCursor({ x, y, visible: true, effect: 'click', effectKey: key + 1 });
        await sleep(CLICK_HOLD_MS);
        setCursor(prev => ({ ...prev, effect: 'idle', effectKey: key + 2 }));
    }, []);

    return { cursor, updateDomMap, animateClick, animateType, hideCursor, showAt, clickAt };
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
