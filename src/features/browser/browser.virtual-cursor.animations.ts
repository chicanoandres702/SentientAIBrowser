// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Virtual cursor animations
 * [Subtask] Animated value factory for cursor position, ripple, and caret effects
 * [Upstream] CursorState -> [Downstream] Animated values
 * [Law Check] 65 lines | Passed 100-Line Law
 */

import { Animated } from 'react-native';
import type { CursorState } from '@hooks/useCursorController';

export const createCursorAnimations = () => {
  const posX = new Animated.Value(0);
  const posY = new Animated.Value(0);
  const rippleScale = new Animated.Value(0);
  const rippleOpacity = new Animated.Value(0);
  const caretOpacity = new Animated.Value(0);
  const pointerScale = new Animated.Value(1);

  return { posX, posY, rippleScale, rippleOpacity, caretOpacity, pointerScale };
};

export const animateCursorMovement = (
  animations: ReturnType<typeof createCursorAnimations>,
  cursor: CursorState
) => {
  Animated.parallel([
    Animated.spring(animations.posX, {
      toValue: cursor.x,
      useNativeDriver: false,
      tension: 60,
      friction: 12,
    }),
    Animated.spring(animations.posY, {
      toValue: cursor.y,
      useNativeDriver: false,
      tension: 60,
      friction: 12,
    }),
  ]).start();
};

export const animateClickRipple = (animations: ReturnType<typeof createCursorAnimations>) => {
  animations.rippleScale.setValue(0);
  animations.rippleOpacity.setValue(0.7);
  animations.pointerScale.setValue(0.7);

  Animated.parallel([
    Animated.spring(animations.pointerScale, {
      toValue: 1,
      useNativeDriver: false,
      tension: 200,
      friction: 10,
    }),
    Animated.timing(animations.rippleScale, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }),
    Animated.timing(animations.rippleOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }),
  ]).start();
};

export const animateTypeCaret = (animations: ReturnType<typeof createCursorAnimations>) => {
  const blink = Animated.loop(
    Animated.sequence([
      Animated.timing(animations.caretOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(animations.caretOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
    ])
  );
  blink.start();
  return () => blink.stop();
};
