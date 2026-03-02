// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Haze overlay
 * [Subtask] Cross-platform inset glow - web box-shadow, native EdgeStrips
 * [Upstream] theme -> [Downstream] Animated inset glow
 * [Law Check] 45 lines | Passed 100-Line Law
 */

import React, { useEffect, useRef } from 'react';
import { Platform, Animated } from 'react-native';
import type { AppTheme } from '../../../App';
import { EdgeStrip } from './browser.edge-strip.component';
import { uiColors } from '@features/ui/theme/ui.theme';
import { hexToRgb } from '@features/ui/theme/domain-accent.utils';
import { hazeStyles as styles } from '../../components/HazeOverlay.styles';

interface Props {
  theme: AppTheme;
}

export const HazeOverlay: React.FC<Props> = ({ theme }) => {
  const color = hexToRgb(uiColors(theme).accent);
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 4000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 4000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [pulseAnim]);

  if (Platform.OS === 'web') {
    return (
      <Animated.View
        style={[
          styles.fill,
          {
            boxShadow: `inset 0 0 120px 40px rgba(${color},0.12)`,
            opacity: pulseAnim,
          } as any,
        ]}
      />
    );
  }

  return (
    <Animated.View style={[styles.fill, { opacity: pulseAnim }]} pointerEvents="none">
      <EdgeStrip color={color} side="top" />
      <EdgeStrip color={color} side="bottom" />
      <EdgeStrip color={color} side="left" />
      <EdgeStrip color={color} side="right" />
    </Animated.View>
  );
};
