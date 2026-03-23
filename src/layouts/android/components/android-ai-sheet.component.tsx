// Feature: Android Layout | Trace: src/layouts/android/components/
// Why: Slide-up bottom sheet for AI prompt input and live mission status.
//      Uses Animated.spring for 60fps native-driven slide animation.
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, TouchableWithoutFeedback, StyleSheet, KeyboardAvoidingView } from 'react-native';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { sheetBase } from '../android.styles';
import { PromptInterface } from '../../../components/PromptInterface';

interface Props {
  visible:          boolean;
  onClose:          () => void;
  theme:            AppTheme;
  onExecutePrompt:  (p: string) => Promise<void>;
  statusMessage:    string;
  isAIMode:         boolean;
}

const SHEET_H = 280;

export const AndroidAISheet: React.FC<Props> = ({ visible, onClose, theme, onExecutePrompt, statusMessage, isAIMode }) => {
  const colors   = uiColors(theme);
  const slideY   = useRef(new Animated.Value(SHEET_H)).current;
  const backdropA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,    { toValue: visible ? 0 : SHEET_H, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(backdropA, { toValue: visible ? 1 : 0,       useNativeDriver: true, duration: 200 }),
    ]).start();
  }, [visible, slideY, backdropA]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[sheetBase.backdrop, { opacity: backdropA }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <KeyboardAvoidingView behavior="padding" style={s.kaView} pointerEvents="box-none">
        <Animated.View style={[sheetBase.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={sheetBase.handle} />
          <Text style={[sheetBase.heading, { color: colors.textMuted }]}>AI Agent</Text>

          {/* Status pills */}
          {statusMessage ? (
            <View style={[s.statusRow, { backgroundColor: colors.accentSoft }]}>
              <View style={[s.statusDot, { backgroundColor: colors.accent }]} />
              <Text style={[s.statusText, { color: colors.accent }]} numberOfLines={1}>{statusMessage}</Text>
            </View>
          ) : null}

          {/* Prompt input — reuse the existing component */}
          <PromptInterface onExecutePrompt={onExecutePrompt} theme={theme} />

          {/* AI mode hint */}
          {!isAIMode && (
            <Text style={[s.hint, { color: colors.textFaint }]}>Enable AI mode in Menu → toggle AI Agent to run missions.</Text>
          )}
          <View style={s.bottomSpacer} />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  kaView:     { position: 'absolute', left: 0, right: 0, bottom: 0 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, gap: 8 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { flex: 1, fontSize: 12, fontWeight: '500' },
  hint:       { fontSize: 11, paddingHorizontal: 18, paddingBottom: 6 },
  bottomSpacer: { height: 12 },
});
