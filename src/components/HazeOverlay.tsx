import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { AppTheme } from '../../App';

/** Cross-platform inset glow. Works on Android, iOS, and Web. */
const HAZE_DEPTH = 60;

interface Props { theme: AppTheme }

export const HazeOverlay: React.FC<Props> = ({ theme }) => {
    const color = theme === 'red' ? '255,0,60' : '0,210,255';
    const pulseAnim = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // On web we can use a single inset box-shadow for performance
    if (Platform.OS === 'web') {
        return (
            <Animated.View
                style={[styles.fill, {
                    boxShadow: `inset 0 0 120px 40px rgba(${color},0.12)`,
                    opacity: pulseAnim,
                } as any]}
            />
        );
    }

    // On native, render 4 edge strips with fading opacity
    return (
        <Animated.View style={[styles.fill, { opacity: pulseAnim }]} pointerEvents="none">
            <EdgeStrip color={color} side="top" />
            <EdgeStrip color={color} side="bottom" />
            <EdgeStrip color={color} side="left" />
            <EdgeStrip color={color} side="right" />
        </Animated.View>
    );
};

/** One edge of the vignette using layered opacity bands. */
const BANDS = 5;
const EdgeStrip: React.FC<{ color: string; side: 'top' | 'bottom' | 'left' | 'right' }> = ({ color, side }) => {
    const isHoriz = side === 'top' || side === 'bottom';
    return (
        <View style={[styles.strip, stripPosition(side, isHoriz)]}>
            {Array.from({ length: BANDS }).map((_, i) => {
                const opacity = 0.10 * (1 - i / BANDS);
                const size = `${(100 / BANDS)}%`;
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

const stripPosition = (side: string, isHoriz: boolean) => {
    const base = { position: 'absolute' as const };
    if (isHoriz) {
        return {
            ...base, left: 0, right: 0,
            ...(side === 'top' ? { top: 0 } : { bottom: 0 }),
            height: HAZE_DEPTH,
        };
    }
    return {
        ...base, top: 0, bottom: 0,
        ...(side === 'left' ? { left: 0 } : { right: 0 }),
        width: HAZE_DEPTH,
        flexDirection: 'row' as const,
    };
};

const styles = StyleSheet.create({
    fill: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99,
        pointerEvents: 'none',
    },
    strip: { overflow: 'hidden' },
});

