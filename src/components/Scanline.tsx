// Feature: UI | Trace: README.md
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';

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
        const useNativeDriver = Platform.OS !== 'web';
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: 200, // Sweep past typical header heights
                    duration,
                    useNativeDriver,
                }),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 0,
                    useNativeDriver,
                }),
            ])
        ).start();
    }, [duration]);

    return (
        <View 
            style={[StyleSheet.absoluteFill, Platform.OS === 'web' ? { pointerEvents: 'none' as any } : {}]}
            {...(Platform.OS !== 'web' ? { pointerEvents: 'none' as 'none' } : {})}
        >
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
        ...Platform.select({
            web: { boxShadow: '0 0 4px rgba(255,0,60,0.8)' } as any,
            native: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 }
        }),
    },
});
