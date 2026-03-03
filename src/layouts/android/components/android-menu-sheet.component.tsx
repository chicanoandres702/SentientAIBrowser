// Feature: Android Layout | Why: Menu sheet — settings toggles + saved workflow launcher.
//   Slide-up from bottom nav "Menu" tab. Houses ConfigRows + RoutinePicker in one panel.
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated,
         TouchableWithoutFeedback, StyleSheet } from 'react-native';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { RoutinePicker } from '../../../features/routines';
import type { RoutineItem } from '../../../features/routines';
import { ConfigRow } from '../../../components/settings/ConfigRow';
import { sheetBase } from '../android.styles';

interface Props {
  visible:             boolean;
  onClose:             () => void;
  theme:               AppTheme;
  setTheme:            (t: AppTheme) => void;
  isAIMode:            boolean;
  setIsAIMode:         (v: boolean) => void;
  useProxy:            boolean;
  setUseProxy:         (v: boolean) => void;
  isScholarMode:       boolean;
  setIsScholarMode:    (v: boolean) => void;
  routines:            RoutineItem[];
  routinesLoading:     boolean;
  onRunRoutine:        (r: RoutineItem) => void;
}

const SHEET_H = 560;

export const AndroidMenuSheet: React.FC<Props> = (p) => {
  const colors  = uiColors(p.theme);
  const slideY  = useRef(new Animated.Value(SHEET_H)).current;
  const backdropA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY,    { toValue: p.visible ? 0 : SHEET_H, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(backdropA, { toValue: p.visible ? 1 : 0,       useNativeDriver: true, duration: 200 }),
    ]).start();
  }, [p.visible, slideY, backdropA]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={p.visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={p.onClose}>
        <Animated.View style={[sheetBase.backdrop, { opacity: backdropA }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[sheetBase.sheet, s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={sheetBase.handle} />
        <Text style={[sheetBase.heading, { color: colors.textMuted }]}>Menu</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Engine toggles ────────────────────────────── */}
          <Text style={[s.section, { color: colors.textFaint }]}>ENGINE</Text>
          <View style={[s.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
            <ConfigRow label="AI Agent"      sub="Autonomous navigation"   value={p.isAIMode}      onToggle={p.setIsAIMode}      accent={colors.accent} />
            <ConfigRow label="CORS Proxy"    sub="Bypass origin locks"     value={p.useProxy}      onToggle={p.setUseProxy}      accent={colors.accent} />
            <ConfigRow label="Scholar Mode"  sub="Capella academic assist" value={p.isScholarMode} onToggle={p.setIsScholarMode} accent="#bf5af2"       />
          </View>

          {/* ── Theme ─────────────────────────────────────── */}
          <Text style={[s.section, { color: colors.textFaint }]}>THEME</Text>
          <View style={[s.themeRow, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
            {(['red', 'blue'] as AppTheme[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[s.themeBtn, { borderColor: p.theme === t ? colors.accent : colors.border }]}
                onPress={() => p.setTheme(t)}
              >
                <View style={[s.themeDot, { backgroundColor: t === 'red' ? '#ff5c8a' : '#5aa8ff' }]} />
                <Text style={[s.themeLabel, { color: p.theme === t ? colors.accent : colors.textMuted }]}>
                  {t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Saved Workflows ───────────────────────────── */}
          <Text style={[s.section, { color: colors.textFaint }]}>SAVED WORKFLOWS</Text>
          <RoutinePicker
            routines={p.routines}
            loading={p.routinesLoading}
            theme={p.theme}
            onRun={p.onRunRoutine}
            maxHeight={240}
          />
          <View style={s.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  sheet:       { height: SHEET_H },
  section:     { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 6, marginHorizontal: 4 },
  card:        { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  themeRow:    { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  themeBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 10, justifyContent: 'center' },
  themeDot:    { width: 12, height: 12, borderRadius: 6 },
  themeLabel:  { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  bottomSpacer:{ height: 32 },
});
