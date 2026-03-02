// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Virtual cursor component
 * [Subtask] Animated visual pseudo-cursor showing AI clicking/typing in real-time
 * [Upstream] CursorState -> [Downstream] Animated overlay UI
 * [Law Check] 73 lines | Passed 100-Line Law
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import type { CursorState } from '@hooks/useCursorController';
import {
  createCursorAnimations,
  animateCursorMovement,
  animateClickRipple,
  animateTypeCaret,
} from './browser.virtual-cursor.animations';
import { virtualCursorStyles } from './browser.virtual-cursor.styles';

interface Props {
  cursor: CursorState;
  accentColor: string;
}

export const VirtualCursor: React.FC<Props> = React.memo(({ cursor, accentColor }) => {
  const animations = useRef(createCursorAnimations()).current;

  useEffect(() => {
    animateCursorMovement(animations, cursor);
  }, [cursor.x, cursor.y, animations]);

  useEffect(() => {
    if (cursor.effect !== 'click') return;
    animateClickRipple(animations);
  }, [cursor.effectKey, cursor.effect, animations]);

  useEffect(() => {
    if (cursor.effect !== 'type') {
      animations.caretOpacity.setValue(0);
      return;
    }
    const unsubscribe = animateTypeCaret(animations);
    return unsubscribe;
  }, [cursor.effect, cursor.effectKey, animations]);

  if (!cursor.visible) return null;

  return (
    <Animated.View
      style={[
        virtualCursorStyles.root,
        { transform: [{ translateX: animations.posX }, { translateY: animations.posY }] },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          virtualCursorStyles.ripple,
          {
            borderColor: accentColor,
            opacity: animations.rippleOpacity,
            transform: [{ scale: Animated.multiply(animations.rippleScale, 40) }],
          },
        ]}
      />
      <Animated.View
        style={[
          virtualCursorStyles.pointer,
          { borderLeftColor: accentColor, transform: [{ scale: animations.pointerScale }] },
        ]}
      >
        <View style={[virtualCursorStyles.pointerInner, { backgroundColor: accentColor }]} />
      </Animated.View>
      <Animated.View
        style={[virtualCursorStyles.caret, { backgroundColor: accentColor, opacity: animations.caretOpacity }]}
      />
      <View style={[virtualCursorStyles.glow, { backgroundColor: accentColor }]} />
    </Animated.View>
  );
});

VirtualCursor.displayName = 'VirtualCursor';
