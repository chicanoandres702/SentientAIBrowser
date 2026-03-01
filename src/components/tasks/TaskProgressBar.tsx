// Feature: Tasks UI | Why: Animated progress bar with completion state
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface Props {
    progress?: number;
    accentColor: string;
    showPercentage?: boolean;
    height?: number;
}

export const TaskProgressBar: React.FC<Props> = ({ progress = 0, accentColor, showPercentage = true, height = 4 }) => {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    const isDone = clampedProgress >= 100;
    // Why: green when complete, accent when in-progress — bar color signals status at a glance
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
                // Why: swap to ✓ checkmark at 100% so completion is unmissable
                <Text style={[styles.percentage, { color: barColor }]}>
                    {isDone ? '✓' : `${Math.round(clampedProgress)}%`}
                </Text>
            )}
        </View>
    );
};

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
                // Why: smooth animated fill as tasks complete — makes progress feel alive
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
                // Why: green glow when 100% — reinforces the ✓ badge
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
