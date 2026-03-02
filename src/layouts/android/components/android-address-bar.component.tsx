// Feature: Android Layout | Trace: src/layouts/android/components/
// Why: Touch-first address bar — 48dp, focus animation, security badge, back/forward/reload.
import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { A } from '../android.styles';
import * as Haptics from 'expo-haptics';

interface Props {
  url: string;
  onNavigate: (url: string) => void;
  onBack?:    () => void;
  onForward?: () => void;
  onReload?:  () => void;
  theme: AppTheme;
}

export const AndroidAddressBar: React.FC<Props> = ({ url, onNavigate, onBack, onForward, onReload, theme }) => {
  const colors   = uiColors(theme);
  const [input,   setInput]     = useState(url);
  const [focused, setFocused]   = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => { setInput(url); }, [url]);

  useEffect(() => {
    Animated.spring(anim, { toValue: focused ? 1 : 0, useNativeDriver: false, tension: 100, friction: 12 }).start();
  }, [focused, anim]);

  const borderColor = anim.interpolate({ inputRange: [0,1], outputRange: [BASE.borderSubtle, colors.accent] });

  const go = () => {
    let v = input.trim();
    if (!v) return;
    if (!v.startsWith('http://') && !v.startsWith('https://')) v = 'https://' + v;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onNavigate(v);
  };

  const tap = (fn?: () => void) => { Haptics.selectionAsync().catch(() => {}); fn?.(); };

  return (
    <View style={s.bar}>
      <TouchableOpacity hitSlop={A.hitSlop} onPress={() => tap(onBack)}  style={s.navBtn}>
        <Text style={[s.navIcon, { color: colors.textDim }]}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity hitSlop={A.hitSlop} onPress={() => tap(onForward)} style={s.navBtn}>
        <Text style={[s.navIcon, { color: colors.textDim }]}>›</Text>
      </TouchableOpacity>

      <Animated.View style={[s.pill, { borderColor }]}>
        <Text style={[s.lock, { color: colors.textMuted }]}>🔒</Text>
        <TextInput
          style={[s.input, { color: colors.text }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={go}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search or enter URL..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none" autoCorrect={false} selectTextOnFocus
          returnKeyType="go"
        />
        <TouchableOpacity hitSlop={A.hitSlop} onPress={() => tap(onReload)} style={s.reload}>
          <Text style={{ color: focused ? colors.accent : colors.textMuted, fontSize: 17 }}>↻</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  bar:    { height: A.addrBarH, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, backgroundColor: BASE.bgElevated, gap: 2 },
  navBtn: { width: 34, alignItems: 'center', justifyContent: 'center' },
  navIcon:{ fontSize: 24, lineHeight: 28 },
  pill:   { flex: 1, flexDirection: 'row', alignItems: 'center', height: 34, borderRadius: 17, borderWidth: 1, backgroundColor: BASE.inputBg, paddingHorizontal: 10, gap: 6 },
  lock:   { fontSize: 13 },
  input:  { flex: 1, fontSize: 13.5, fontFamily: 'monospace', padding: 0, height: 34 },
  reload: { paddingHorizontal: 4 },
});
