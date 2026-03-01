// Feature: UI | Trace: README.md
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { uiColors, BASE } from '../features/ui/theme/ui.theme';
import { resolveDomainAccent } from '../features/ui/theme/domain-accent.utils';

import { styles } from './SentientStatusBar.styles';

interface Props {
    isAIMode: boolean;
    statusMessage: string;
    useProxy: boolean;
    theme: 'red' | 'blue';
    domain?: string;
    isScholarMode?: boolean;
    totalEarnings?: number;
}

export const SentientStatusBar: React.FC<Props> = React.memo(({ isAIMode, statusMessage, useProxy, theme, domain, isScholarMode, totalEarnings }) => {
    const colors = uiColors(theme);
    const accent = resolveDomainAccent({ theme, domain, isScholarMode });
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
                        backgroundColor: isActive ? accent : BASE.inactive,
                        shadowColor: accent,
                        shadowOpacity: isActive ? 0.9 : 0,
                        shadowRadius: 6,
                    }]}
                />
                <Text style={[styles.modeTag, { color: isActive ? accent : colors.textMuted }]}>
                    {isScholarMode ? 'SCHOLAR' : (domain?.includes('swagbucks') || domain?.includes('survey')) ? 'SURVEY' : isAIMode ? 'SENTIENT' : 'MANUAL'}
                </Text>
                <View style={styles.divider} />
                <Text style={[styles.msg, { color: isActive ? colors.text : colors.textMuted, textShadowColor: accent, textShadowRadius: isActive ? 8 : 0 }]}>
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
                <Text style={[styles.proxy, { color: useProxy ? accent + 'aa' : colors.textMuted }]}>
                    {useProxy ? '⬡ PROXY' : '⬡ DIRECT'}
                </Text>
            </View>
        </View>
    );
});

