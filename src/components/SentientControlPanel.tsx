// Feature: UI | Trace: README.md
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { AppTheme } from '../../App';

import { styles } from './SentientControlPanel.styles';

interface Props {
    isPaused: boolean;
    onTogglePause: () => void;
    onStop: () => void;
    onNext: () => void;
    onPrev: () => void;
    theme: AppTheme;
}

export const SentientControlPanel: React.FC<Props> = React.memo(({ isPaused, onTogglePause, onStop, onNext, onPrev, theme }) => {
    const accent = theme === 'red' ? '#ff003c' : '#00d2ff';
    const shockwaveAnim = useRef(new Animated.Value(0)).current;

    const triggerShockwave = () => {
        shockwaveAnim.setValue(0);
        Animated.timing(shockwaveAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start(() => shockwaveAnim.setValue(0));
    };

    const handlePress = (callback: () => void) => {
        triggerShockwave();
        callback();
    };

    const shockOpacity = shockwaveAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0.4, 0]
    });

    const shockScale = shockwaveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 2.5]
    });

    return (
        <View style={styles.container}>
            <View style={styles.pill}>
                <TouchableOpacity style={styles.sideBtn} onPress={() => handlePress(onPrev)}>
                    <Text style={styles.sideIcon}>⏮</Text>
                </TouchableOpacity>

                <Animatable.View
                    animation={!isPaused ? 'pulse' : undefined}
                    iterationCount="infinite"
                    duration={1500}
                >
                    <TouchableOpacity
                        style={[styles.mainBtn, { borderColor: accent, boxShadow: `0 0 15px ${accent}` }]}
                        onPress={() => handlePress(onTogglePause)}
                    >
                        <Animated.View style={[
                            styles.shockwave, 
                            { 
                                backgroundColor: accent, 
                                opacity: shockOpacity, 
                                transform: [{ scale: shockScale }] 
                            }
                        ]} />
                        <View style={[styles.mainBtnInner, { backgroundColor: isPaused ? 'transparent' : accent }]}>
                            <Text style={[styles.mainBtnText, { color: isPaused ? accent : '#000' }]}>
                                {isPaused ? '▶' : '⏸'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </Animatable.View>

                <TouchableOpacity style={styles.sideBtn} onPress={() => handlePress(onNext)}>
                    <Text style={styles.sideIcon}>⏭</Text>
                </TouchableOpacity>

                <View style={styles.sep} />

                <TouchableOpacity style={styles.stopBtn} onPress={() => handlePress(onStop)}>
                    <Text style={styles.stopIcon}>⏹</Text>
                </TouchableOpacity>

                <View style={[styles.statusDot, { backgroundColor: isPaused ? '#555' : accent, boxShadow: `0 0 8px ${accent}` }]} />
                <Text style={[styles.statusLabel, { color: isPaused ? '#555' : accent }]}>
                    {isPaused ? 'PAUSED' : 'LIVE'}
                </Text>
            </View>
        </View>
    );
});
