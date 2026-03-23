// Feature: Analytics | Trace: README.md
/*
 * [Parent Feature/Milestone] Analytics
 * [Child Task/Issue] Sentinel Interactive Modal
 * [Subtask] Interactive request modal for confirmations and inputs
 * [Upstream] Question + requestType -> [Downstream] Interactive Response
 * [Law Check] 39 lines | Passed 100-Line Law
 */

import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Scanline } from '@features/browser';
import { styles } from './sentinel-interactive.modal.styles';

interface Props {
  visible: boolean;
  question: string;
  requestType: 'confirm' | 'input';
  theme: 'red' | 'blue';
  onResponse: (response: string | boolean) => void;
}

export const SentinelInteractiveModal: React.FC<Props> = ({ visible, question, requestType, theme, onResponse }) => {
  const [inputValue, setInputValue] = useState('');
  const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';
  const handleSubmitInput = () => {
    if (inputValue.trim()) {
      onResponse(inputValue);
      setInputValue('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,5,8,0.95)' }]} />
        )}
        <View style={[styles.content, { borderColor: accentColor }]}>
          <Scanline color={accentColor} opacity={0.1} duration={5000} />
          <View style={styles.header}>
            <View style={[styles.pulse, { backgroundColor: accentColor }]} />
            <Text style={styles.title}>SENTINEL REQUEST</Text>
          </View>
          <Text style={styles.question}>{question}</Text>
          {requestType === 'input' && (
            <TextInput
              style={[styles.input, { borderColor: accentColor + '44', color: '#fff' }]}
              placeholder="Enter required info..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />
          )}
          <View style={styles.buttonRow}>
            {requestType === 'confirm' ? (
              <>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => onResponse(false)}>
                  <Text style={styles.cancelText}>DECLINE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: accentColor }]} onPress={() => onResponse(true)}>
                  <Text style={styles.confirmText}>CONFIRM</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.btn, { backgroundColor: accentColor, width: '100%' }]} onPress={handleSubmitInput}>
                <Text style={styles.confirmText}>SUBMIT RESPONSE</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
