/**
 * Sentient File Header
 * Why: Android layout sheet logic for Sentient AI Browser
 * Filepath: src/layouts/android/useAndroidLayoutSheets.ts
 * Description: Manages Android sheet state and back handler for navigation
 * Trace: Used by AndroidLayout, workflow, and orchestrator modules
 * Wiring: Exported hook, consumed by Android layout and workflow features
 */
// Feature: Android Layout | Trace: src/layouts/android/AndroidLayout.tsx
import { useState, useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { type NavTab } from './components/android-nav-bar.component';

export function useAndroidLayoutSheets() {
  const [sheet, setSheet] = useState<NavTab | null>(null);
  const close = useCallback(() => setSheet(null), []);
  useEffect(() => {
    const handler = () => { if (sheet) { close(); return true; } return false; };
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [sheet, close]);
  return { sheet, setSheet, close };
}
