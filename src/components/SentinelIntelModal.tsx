import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Scanline } from './Scanline';
import { EarningsChart } from '../features/analytics/components/EarningsChart';
import { MemoryPersonaView } from '../features/analytics/components/MemoryPersonaView';
import { ScholarModuleView } from '../features/analytics/components/ScholarModuleView';

interface Props {
    visible: boolean;
    onClose: () => void;
    theme: {
        background: string;
        accent: string;
        text: string;
        secondary: string;
    };
    earningsData: number[];
    domain: string;
}

export const SentinelIntelModal: React.FC<Props> = ({ visible, onClose, theme, earningsData, domain }) => {
    const isScholar = domain === 'capella.edu';

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                {Platform.OS !== 'web' ? (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5, 5, 8, 0.95)' }]} />
                )}
                
                <View style={[styles.content, { borderColor: theme.accent }]}>
                    <Scanline color={theme.accent} opacity={0.1} duration={8000} />
                    
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.pulse, { backgroundColor: theme.accent }]} />
                            <Text style={styles.title}>{isScholar ? 'SCHOLAR HUB' : 'SENTINEL INTEL DASHBOARD'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={[styles.closeText, { color: theme.accent }]}>CLOSE [ESC]</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {domain.includes('swagbucks') && <EarningsChart theme={theme} data={earningsData} />}
                        {isScholar && <ScholarModuleView theme={theme} domain={domain} />}
                        <MemoryPersonaView theme={theme} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: 'rgba(10, 10, 15, 0.98)',
        width: '100%',
        maxWidth: 800,
        height: '85%',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    title: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 4,
    },
    closeBtn: {
        padding: 4,
    },
    closeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    }
});
