// Feature: UI | Trace: README.md
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

interface Props {
    color?: string;
    duration?: number;
    opacity?: number;
}

/**
 * Cinematic Scanline animation.
 * A faint horizontal line that sweeps vertically across its parent.
 */
export const Scanline: React.FC<Props> = ({
    color = '#ff003c',
    duration = 3000,
    opacity = 0.3
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: 200, // Sweep past typical header heights
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [duration]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View
                style={[
                    styles.line,
                    {
                        backgroundColor: color,
                        opacity,
                        transform: [{ translateY }]
                    }
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
