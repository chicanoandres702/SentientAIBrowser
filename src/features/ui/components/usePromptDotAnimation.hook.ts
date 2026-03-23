// Feature: UI | Source: PromptInterface.tsx
// Task: Extract dot animation hook from PromptInterface
// Why: Encapsulate dot rotation timer logic — improves testability and reusability
import { useEffect, useRef, useState } from 'react';

const DOTS = ['', '.', '..', '...'];

export const usePromptDotAnimation = (isPlanning: boolean): string => {
  const [dotIdx, setDotIdx] = useState(0);
  const dotTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (isPlanning) {
      dotTimer.current = setInterval(() => setDotIdx(i => (i + 1) % DOTS.length), 420);
    } else {
      clearInterval(dotTimer.current);
      setDotIdx(0);
    }
    return () => clearInterval(dotTimer.current);
  }, [isPlanning]);

  return DOTS[dotIdx];
};
