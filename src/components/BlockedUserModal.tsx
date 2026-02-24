// Feature: UI | Trace: README.md
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
    visible: boolean;
    reason: string;
    theme: 'red' | 'blue';
    onClose: () => void;
}

export const BlockedUserModal: React.FC<Props> = ({ visible, reason, theme, onClose }) => {
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { borderColor: accentColor }]}>
                    <Text style={styles.modalTitle}>INTERVENTION REQUIRED</Text>
                    <Text style={styles.modalText}>{reason}</Text>
                    <TouchableOpacity
                        style={[styles.modalButton, { backgroundColor: accentColor }]}
                        onPress={onClose}
                    >
                        <Text style={styles.modalButtonText}>CONTINUE AUTOMATION</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalContent: {
        backgroundColor: '#0a0a0a',
        padding: 30,
        borderRadius: 2,
        width: '100%',
        maxWidth: 450,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 20,
        letterSpacing: 2,
    },
    modalText: {
        color: '#888',
        fontSize: 14,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 30,
    },
    modalButton: {
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 0,
    },
    modalButtonText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    }
});
