// Feature: UI | Why: Modal for blocked user intervention — uses theme tokens
import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { uiColors } from '../features/ui/theme/ui.theme';
import { overlayStyles as s } from '../features/ui/theme/overlay.styles';

interface Props {
    visible: boolean;
    reason: string;
    theme: 'red' | 'blue';
    onClose: () => void;
}

export const BlockedUserModal: React.FC<Props> = ({ visible, reason, theme, onClose }) => {
    const colors = uiColors(theme);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={s.modalOverlay}>
                <View style={[s.modalContent, { borderColor: colors.accent }]}>
                    <Text style={s.modalTitle}>INTERVENTION REQUIRED</Text>
                    <Text style={s.modalText}>{reason}</Text>
                    <TouchableOpacity
                        style={[s.modalButton, { backgroundColor: colors.accent }]}
                        onPress={onClose}
                    >
                        <Text style={s.modalButtonText}>CONTINUE AUTOMATION</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
