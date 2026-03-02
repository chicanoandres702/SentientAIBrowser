// Feature: UI | Source: PromptInterface.tsx
// Task: Extract keyframe injection utility from PromptInterface
// Why: Separated concern — keyframes should be injected once, independently of component lifecycle
import { Platform } from 'react-native';

export const injectPromptKeyframes = (): void => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const id = '__prompt-keyframes';
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
  `;
  document.head.appendChild(el);
};
