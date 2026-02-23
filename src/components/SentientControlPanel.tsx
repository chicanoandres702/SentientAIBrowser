import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    isPaused: boolean;
    onTogglePause: () => void;
    onStop: () => void;
    onNext: () => void;
    onPrev: () => void;
    theme: 'red' | 'blue';
}

export const SentientControlPanel: React.FC<Props> = ({ isPaused, onTogglePause, onStop, onNext, onPrev, theme }) => {
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={styles.container}>
            <View style={styles.bar}>
                <TouchableOpacity style={styles.btn} onPress={onPrev}>
                    <Text style={styles.btnText}>⏮</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: isPaused ? '#111' : accentColor }]}
                    onPress={onTogglePause}
                >
                    <Text style={[styles.playText, { color: isPaused ? accentColor : '#000' }]}>
                        {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btn} onPress={onNext}>
                    <Text style={styles.btnText}>⏭</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.stopBtn} onPress={onStop}>
                    <Text style={styles.stopText}>⏹ STOP</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        borderRadius: 8,
        padding: 5,
        borderWidth: 1,
        borderColor: '#333',
    },
    btn: {
        padding: 10,
        marginHorizontal: 5,
    },
    btnText: {
        color: '#666',
        fontSize: 18,
    },
    playBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 4,
        minWidth: 90,
        alignItems: 'center',
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    playText: {
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 1,
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#222',
        marginHorizontal: 10,
    },
    stopBtn: {
        padding: 10,
    },
    stopText: {
        color: '#ff4444',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
