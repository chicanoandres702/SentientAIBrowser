// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Edge strip vignette
 * [Subtask] Native-only edge strip vignette for HazeOverlay on mobile
 * [Upstream] theme color + side -> [Downstream] Layered opacity bands
 * [Law Check] 56 lines | Passed 100-Line Law
 */

import React from 'react';
import { View } from 'react-native';
import { edgeStripStyles as styles } from '../../components/EdgeStrip.styles';

const HAZE_DEPTH = 60;
const BANDS = 5;

const stripPosition = (side: string, isHoriz: boolean) => {
  const base = { position: 'absolute' as const };
  if (isHoriz) {
    return {
      ...base,
      left: 0,
      right: 0,
      ...(side === 'top' ? { top: 0 } : { bottom: 0 }),
      height: HAZE_DEPTH,
    };
  }
  return {
    ...base,
    top: 0,
    bottom: 0,
    ...(side === 'left' ? { left: 0 } : { right: 0 }),
    width: HAZE_DEPTH,
    flexDirection: 'row' as const,
  };
};

interface Props {
  color: string;
  side: 'top' | 'bottom' | 'left' | 'right';
}

export const EdgeStrip: React.FC<Props> = ({ color, side }) => {
  const isHoriz = side === 'top' || side === 'bottom';

  return (
    <View style={[styles.strip, stripPosition(side, isHoriz)]}>
      {Array.from({ length: BANDS }).map((_, i) => {
        const opacity = 0.1 * (1 - i / BANDS);
        const size = `${100 / BANDS}%`;
        return (
          <View
            key={i}
            style={{
              backgroundColor: `rgba(${color},${opacity})`,
              ...(isHoriz
                ? { width: '100%', height: size }
                : { height: '100%', width: size }),
            }}
          />
        );
      })}
    </View>
  );
};
