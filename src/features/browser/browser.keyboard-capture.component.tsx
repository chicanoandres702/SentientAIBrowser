// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Keyboard capture overlay
 * [Subtask] Forwards web keypresses to Playwright when proxy preview is active
 * [Upstream] document keydown events -> [Downstream] onType / onSpecialKey callbacks
 * [Law Check] 52 lines | Passed 100-Line Law
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

const SPECIAL_KEYS = new Set([
  'Enter',
  'Backspace',
  'Tab',
  'Escape',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

interface Props {
  active: boolean;
  onType: (char: string) => void;
  onSpecialKey: (key: string) => void;
}

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
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onType(e.key);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onType, onSpecialKey]);

  return null;
};
