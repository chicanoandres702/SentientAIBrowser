// Feature: Settings | Why: Intel dashboard modal — shows earnings, scholar, and memory persona views
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Scanline } from '@features/browser';
import { EarningsChart } from '../features/analytics/components/EarningsChart';
import { MemoryPersonaView } from '../features/analytics/components/MemoryPersonaView';
import { ScholarModuleView } from '../features/analytics/components/ScholarModuleView';
import { sentinelStyles as s } from './SentinelIntelModal.styles';

interface Props {
    visible: boolean;
    onClose: () => void;
    theme: { background: string; accent: string; text: string; secondary: string };
    earningsData: number[];
    domain: string;
}

export const SentinelIntelModal: React.FC<Props> = ({ visible, onClose, theme, earningsData, domain }) => {
    const isScholar = domain === 'capella.edu';
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={s.overlay}>
                {Platform.OS !== 'web' ? (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5, 5, 8, 0.95)' }]} />
                )}
                <View style={[s.content, { borderColor: theme.accent }]}>
                    <Scanline color={theme.accent} opacity={0.1} duration={8000} />
                    <View style={s.header}>
                        <View style={s.headerLeft}>
                            <View style={[s.pulse, { backgroundColor: theme.accent }]} />
                            <Text style={s.title}>{isScholar ? 'SCHOLAR HUB' : 'SENTINEL INTEL DASHBOARD'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <Text style={[s.closeText, { color: theme.accent }]}>CLOSE [ESC]</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {domain?.includes('swagbucks') && <EarningsChart theme={theme} data={earningsData} />}
                        {isScholar && <ScholarModuleView theme={theme} />}
                        <MemoryPersonaView theme={theme} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};
