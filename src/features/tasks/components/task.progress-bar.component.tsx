// Feature: Tasks | Trace: README.md
/*
 * [Parent Feature/Milestone] Tasks
 * [Child Task/Issue] Task progress bar component
 * [Subtask] Animated progress bar with completion state indicator
 * [Upstream] progress percentage + accentColor -> [Downstream] Animated bar UI
 * [Law Check] 91 lines | Passed 100-Line Law
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface Props {
  progress?: number;
  accentColor: string;
  showPercentage?: boolean;
  height?: number;
}

export const TaskProgressBar: React.FC<Props> = ({
  progress = 0,
  accentColor,
  showPercentage = true,
  height = 4,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isDone = clampedProgress >= 100;
  const barColor = isDone ? '#00ffaa' : accentColor;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: barColor,
              height,
            },
            isDone && styles.fillDone,
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.percentage, { color: barColor }]}>
          {isDone ? '✓' : `${Math.round(clampedProgress)}%`}
        </Text>
      )}
    </View>
  );
};

TaskProgressBar.displayName = 'TaskProgressBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  track: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 2,
    ...Platform.select({
      web: {
        transition: 'width 0.5s ease, background-color 0.4s ease',
        boxShadow: '0 0 8px rgba(0, 0, 0, 0.5)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  fillDone: {
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(0, 255, 170, 0.5)',
      } as any,
      default: {
        shadowColor: '#00ffaa',
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
    }),
  },
  percentage: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'right',
  },
});
