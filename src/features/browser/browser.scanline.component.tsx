// Feature: Browser | Trace: README.md
/*
 * [Parent Feature/Milestone] Browser
 * [Child Task/Issue] Scanline animation
 * [Subtask] Cinematic horizontal scanline sweeping vertically
 * [Upstream] animation props -> [Downstream] Animated scanline view
 * [Law Check] 65 lines | Passed 100-Line Law
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';

interface Props {
  color?: string;
  duration?: number;
  opacity?: number;
}

export const Scanline: React.FC<Props> = ({ color = '#ff5c8a', duration = 3000, opacity = 0.3 }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 200,
          duration,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 0,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  }, [duration, translateY]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.line,
          {
            backgroundColor: color,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  line: {
    height: 1,
    width: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
});

Scanline.displayName = 'Scanline';
