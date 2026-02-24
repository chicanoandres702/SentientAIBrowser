import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface Props {
    isAIMode: boolean;
    statusMessage: string;
    useProxy: boolean;
    theme: 'red' | 'blue';
    domain?: string;
    isScholarMode?: boolean;
    totalEarnings?: number;
}

export const SentientStatusBar: React.FC<Props> = ({ isAIMode, statusMessage, useProxy, theme, domain, isScholarMode, totalEarnings }) => {
    let accent = theme === 'red' ? '#ff003c' : '#00d2ff';
    if (isScholarMode || domain?.includes('capella.edu')) accent = '#bf5af2'; // Purple Scholar Accent
    if (!isScholarMode && (domain?.includes('swagbucks') || domain?.includes('survey'))) accent = '#00d2ff'; // Survey Blue
    const isActive = statusMessage !== 'Ready' && statusMessage !== 'Paused';

    // Seeker Dot Animation
    const seekerPos = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(seekerPos, {
                    toValue: 1,
                    duration: 5000,
                    useNativeDriver: false,
                }),
                Animated.timing(seekerPos, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    const left = seekerPos.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.bar, { borderTopColor: accent + '18' }]}>
            {/* Seeker Dot */}
            <Animated.View style={[styles.seeker, { left, backgroundColor: accent, shadowColor: accent }]} />

            <View style={styles.left}>
                <Animatable.View
                    animation={isActive ? 'pulse' : undefined}
                    iterationCount="infinite"
                    duration={1200}
                    style={[styles.dot, {
                        backgroundColor: isActive ? accent : '#2a2a2a',
                        shadowColor: accent,
                        shadowOpacity: isActive ? 0.9 : 0,
                        shadowRadius: 6,
                    }]}
                />
                <Text style={[styles.modeTag, { color: isActive ? accent : '#444' }]}>
                    {isScholarMode ? 'SCHOLAR' : (domain?.includes('swagbucks') || domain?.includes('survey')) ? 'SURVEY' : isAIMode ? 'SENTIENT' : 'MANUAL'}
                </Text>
                <View style={styles.divider} />
                <Text style={[styles.msg, { color: isActive ? '#fff' : '#666', textShadowColor: accent, textShadowRadius: isActive ? 8 : 0 }]}>
                    {statusMessage.toUpperCase()}
                </Text>
            </View>

            <View style={styles.right}>
                <View style={styles.telemetry}>
                    <Text style={styles.telLabel}>CPU </Text>
                    <Text style={[styles.telValue, { color: accent }]}>82%</Text>
                    <Text style={styles.telSep}> / </Text>
                    <Text style={styles.telLabel}>MEM </Text>
                    <Text style={[styles.telValue, { color: accent }]}>1.2GB</Text>
                    {totalEarnings !== undefined && (
                        <>
                            <Text style={styles.telSep}> / </Text>
                            <Text style={styles.telLabel}>REWARDS </Text>
                            <Text style={[styles.telValue, { color: accent }]}>{totalEarnings} SB</Text>
                        </>
                    )}
                </View>
                <Text style={[styles.proxy, { color: useProxy ? accent + 'aa' : '#333' }]}>
                    {useProxy ? '⬡ PROXY' : '⬡ DIRECT'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        height: 30,
        backgroundColor: 'rgba(5, 5, 5, 0.98)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    seeker: {
        position: 'absolute',
        top: -1,
        width: 40,
        height: 1,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    left: { flexDirection: 'row', alignItems: 'center' },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 10,
        shadowOffset: { width: 0, height: 0 },
    },
    modeTag: { fontSize: 8, fontWeight: '900', letterSpacing: 2 },
    divider: { width: 1, height: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginHorizontal: 12 },
    msg: { fontSize: 8, fontWeight: 'bold', letterSpacing: 1.5, textShadowOffset: { width: 0, height: 0 } },
    right: { flexDirection: 'row', alignItems: 'center' },
    telemetry: { flexDirection: 'row', marginRight: 20, alignItems: 'center' },
    telLabel: { color: '#333', fontSize: 7, fontWeight: 'bold' },
    telValue: { fontSize: 7, fontWeight: '900' },
    telSep: { color: '#222', fontSize: 7 },
    proxy: { fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
});

