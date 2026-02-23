import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
    isAIMode: boolean;
    statusMessage: string;
    useProxy: boolean;
    theme: 'red' | 'blue';
}

export const SentientStatusBar: React.FC<Props> = ({ isAIMode, statusMessage, useProxy, theme }) => {
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={[styles.statusBar, { borderTopColor: theme === 'red' ? 'rgba(255,0,60,0.2)' : 'rgba(0,210,255,0.2)' }]}>
            <View style={styles.statusLeft}>
                <View style={[styles.statusIndicator, { backgroundColor: statusMessage === 'Ready' ? '#00ff00' : '#ffff00' }]} />
                <Text style={styles.statusText}>MODE: {isAIMode ? 'SENTIENT' : 'MANUAL'}</Text>
                <Text style={[styles.statusText, { marginLeft: 20 }]}>CPU: {statusMessage.toUpperCase()}</Text>
            </View>
            <View style={styles.statusRight}>
                <Text style={[styles.statusText, { color: useProxy ? accentColor : '#444' }]}>
                    {useProxy ? 'PROTOCOL: ENCRYPTED PROXY' : 'PROTOCOL: DIRECT'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    statusBar: {
        height: 28,
        backgroundColor: '#000',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderTopWidth: 1,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 10,
        shadowColor: '#00ff00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    statusText: {
        color: '#333',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.5,
    }
});
