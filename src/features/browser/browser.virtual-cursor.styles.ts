// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Virtual cursor styles
 * [Subtask] StyleSheet definitions for virtual cursor components
 * [Upstream] theme color -> [Downstream] animated styles
 * [Law Check] 67 lines | Passed 100-Line Law
 */

import { StyleSheet } from 'react-native';

export const virtualCursorStyles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    width: 0,
    height: 0,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderLeftColor: '#ff3366',
    borderTopWidth: 5,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-30deg' }, { translateX: -2 }, { translateY: -2 }],
  },
  pointerInner: {
    position: 'absolute',
    top: -3,
    left: -12,
    width: 10,
    height: 14,
    borderRadius: 2,
    opacity: 0.3,
  },
  ripple: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 2,
    height: 2,
    borderRadius: 20,
    borderWidth: 2,
  },
  caret: {
    position: 'absolute',
    top: 4,
    left: 16,
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.2,
  },
});
