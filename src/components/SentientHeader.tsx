// Feature: UI | Trace: README.md
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../../App';
import { Scanline } from './Scanline';

import { styles } from './SentientHeader.styles';

interface Props {
    isAIMode: boolean;
    isSidebarVisible: boolean;
    setIsSidebarVisible: (v: boolean) => void;
    setIsSettingsVisible: (v: boolean) => void;
    setIsIntelVisible: (v: boolean) => void;
    theme: AppTheme;
    domain?: string;
}

export const SentientHeader: React.FC<Props> = ({ isAIMode, isSidebarVisible, setIsSidebarVisible, setIsSettingsVisible, setIsIntelVisible, theme, domain }) => {
    let accent = theme === 'red' ? '#ff003c' : '#00d2ff';
    if (domain === 'capella.edu') accent = '#D4AF37'; // Academy Gold

    return (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={['rgba(20, 20, 25, 0.95)', 'rgba(5, 5, 5, 1)']}
                style={StyleSheet.absoluteFill}
            />

            {isAIMode && <Scanline color={accent} opacity={0.15} duration={4000} />}

            <View style={styles.content}>
                {/* Brand */}
                <View style={styles.brand}>
                    <View style={styles.orbStack}>
                        <Animatable.View
                            animation={isAIMode ? 'pulse' : undefined}
                            iterationCount="infinite"
                            duration={2000}
                            style={[styles.brandOrbOuter, { backgroundColor: accent + '33', shadowColor: accent }]}
                        />
                        <View style={[styles.brandOrbInner, { backgroundColor: accent, shadowColor: accent }]} />
                    </View>
                    <Text style={[styles.brandText, { textShadowColor: accent }]}>{domain === 'capella.edu' ? 'SCHOLAR' : 'SENTIENT'}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {isAIMode && (
                        <TouchableOpacity
                            style={[styles.iconBtn, isSidebarVisible && { backgroundColor: accent + '22', borderColor: accent }]}
                            onPress={() => setIsSidebarVisible(!isSidebarVisible)}
                        >
                            <Text style={[styles.iconText, { color: isSidebarVisible ? accent : '#555' }]}>◈</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setIsIntelVisible(true)}>
                        <Text style={styles.iconText}>📊</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSettingsVisible(true)}>
                        <Text style={styles.iconText}>⋯</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

