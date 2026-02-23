import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppTheme } from '../../App';

interface Props {
    isAIMode: boolean;
    isSidebarVisible: boolean;
    setIsSidebarVisible: (visible: boolean) => void;
    setIsSettingsVisible: (visible: boolean) => void;
    theme: AppTheme;
}

export const SentientHeader: React.FC<Props> = ({ isAIMode, isSidebarVisible, setIsSidebarVisible, setIsSettingsVisible, theme }) => {
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <Text style={styles.title}>SENTIENT</Text>
                <View style={styles.headerButtons}>
                    {isAIMode && (
                        <TouchableOpacity
                            onPress={() => setIsSidebarVisible(!isSidebarVisible)}
                            style={styles.headerIcon}
                        >
                            {/* Use a more professional 'Pulse/Intelligence' icon instead of a robot emoji */}
                            <View style={[styles.pulseIcon, { borderColor: isSidebarVisible ? accentColor : '#fff' }]}>
                                <View style={[styles.pulseDot, { backgroundColor: isSidebarVisible ? accentColor : '#fff' }]} />
                            </View>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setIsSettingsVisible(true)} style={styles.headerIcon}>
                        <Text style={{ fontSize: 20, color: '#fff' }}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#050505',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        paddingTop: 45,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        padding: 8,
        marginLeft: 15,
    },
    pulseIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
