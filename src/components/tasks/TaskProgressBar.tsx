// Feature: Tasks UI | Trace: README.md
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

    return (
        <View style={styles.container}>
            <View style={[styles.track, { height }]}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${clampedProgress}%`,
                            backgroundColor: accentColor,
                            height,
                        },
                    ]}
                />
            </View>
            {showPercentage && (
                <Text style={[styles.percentage, { color: accentColor }]}>
                    {Math.round(clampedProgress)}%
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
    percentage: {
        fontSize: 11,
        fontWeight: '600',
        minWidth: 35,
        textAlign: 'right',
    },
});
