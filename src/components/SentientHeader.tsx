import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../../App';
import { Scanline } from './Scanline';

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

const styles = StyleSheet.create({
    headerContainer: {
        height: Platform.OS === 'ios' ? 95 : 70,
        paddingTop: Platform.OS === 'ios' ? 44 : 20,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    brand: { flexDirection: 'row', alignItems: 'center' },
    orbStack: {
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    brandOrbOuter: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    brandOrbInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    brandText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 6,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: { color: '#888', fontSize: 18, lineHeight: 24 },
});

