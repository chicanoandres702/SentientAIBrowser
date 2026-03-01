// Feature: Browser Control | Trace: src/features/browser-control/useManualClickHandler.ts
/*
 * [Reusable Hook] Coordinate scaling for screenshot-based click input
 * [Upstream] UI preview → [Downstream] Playwright action
 * [Why] Extracted from useSentientBrowser to enable reuse in preview controllers
 */
import { useCallback } from 'react';

const PLAYWRIGHT_W = 1280;
const PLAYWRIGHT_H = 800;

export interface ClickHandlerDeps {
  clickAt: (x: number, y: number) => void;
}

export const useManualClickHandler = ({ clickAt }: ClickHandlerDeps) => {
  const handleManualClick = useCallback(
    async (x: number, y: number, containerW: number, containerH: number): Promise<void> => {
      // Compute the actual rendered image rect inside the contain-scaled container
      const scale = Math.min(containerW / PLAYWRIGHT_W, containerH / PLAYWRIGHT_H);
      const renderedW = PLAYWRIGHT_W * scale;
      const renderedH = PLAYWRIGHT_H * scale;
      const offsetX = (containerW - renderedW) / 2;
      const offsetY = (containerH - renderedH) / 2;

      // Map click to Playwright viewport coords, clamped to image bounds
      const scaledX = Math.round(Math.max(0, Math.min((x - offsetX) / scale, PLAYWRIGHT_W)));
      const scaledY = Math.round(Math.max(0, Math.min((y - offsetY) / scale, PLAYWRIGHT_H)));

      // Cursor shows at the image-corrected position
      clickAt(offsetX + scaledX * scale, offsetY + scaledY * scale);
    },
    [clickAt],
  );

  return { handleManualClick };
};
