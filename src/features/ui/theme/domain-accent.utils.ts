// Feature: UI | Why: Single utility for domain-aware accent resolution
// Eliminates 3+ inline domain-accent overrides in header/status/preview
import type { AppTheme } from '../../../../App';
import { domainAccent } from './ui.tokens';
import { uiColors } from './ui.theme';

interface DomainAccentInput {
  theme: AppTheme;
  domain?: string;
  isScholarMode?: boolean;
}

/**
 * Resolves the correct accent color based on domain context.
 * Scholar → gold, Survey → cyan, Purple Scholar → purple,
 * otherwise falls back to theme accent.
 */
export const resolveDomainAccent = (
  { theme, domain, isScholarMode }: DomainAccentInput,
): string => {
  if (domain?.includes('capella.edu')) return domainAccent.scholar;
  if (isScholarMode) return domainAccent.purple;
  if (domain?.includes('swagbucks') || domain?.includes('survey')) {
    return domainAccent.survey;
  }
  return uiColors(theme).accent;
};

/** Hex → RGB string for native gradients (e.g. '255,92,138') */
export const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
};

/** Returns a dimmed version of an accent for secondary UI */
export const dimAccent = (hex: string): string =>
  `${hex}44`;
