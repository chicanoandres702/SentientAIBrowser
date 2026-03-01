// Feature: Browser | Why: Forwards web keypresses to Playwright when the screenshot preview is active
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Keys that have a Playwright key name rather than a printable char
const SPECIAL_KEYS = new Set([
    'Enter', 'Backspace', 'Tab', 'Escape', 'Delete',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown',
]);

interface Props {
    /** Capture only when the proxy preview is mounted and interactive */
    active: boolean;
    /** Receives each printable character individually */
    onType: (char: string) => void;
    /** Receives special / control key names */
    onSpecialKey: (key: string) => void;
}

/**
 * Invisible component — attaches a global document keydown listener on web only.
 * Skips events whose target is a real INPUT / TEXTAREA so the URL bar and task
 * input fields remain unaffected.
 */
export const KeyboardCapture: React.FC<Props> = ({ active, onType, onSpecialKey }) => {
    useEffect(() => {
        if (!active || Platform.OS !== 'web') return;

        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName?.toUpperCase?.() ?? '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            if (SPECIAL_KEYS.has(e.key)) {
                e.preventDefault();
                onSpecialKey(e.key);
                return;
            }
            // Forward printable single characters (ignore modifier shortcuts)
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                onType(e.key);
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [active, onType, onSpecialKey]);

    return null; // no visual element
};
