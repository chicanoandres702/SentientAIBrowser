// Feature: Android Layout | Trace: src/layouts/android/components/
// Why: Standard Android bottom navigation — 4 destinations with accent indicator + haptics.
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { BASE } from '../../../features/ui/theme/ui.primitives';
import { A } from '../android.styles';
import * as Haptics from 'expo-haptics';

export type NavTab = 'browser' | 'ai' | 'tabs' | 'menu';

interface Props {
  active:        NavTab;
  onTabPress:    (t: NavTab) => void;
  theme:         AppTheme;
  tabCount:      number;
  isAIActive:    boolean;
}

const TABS: Array<{ id: NavTab; label: string; icon: string; aiOnly?: boolean }> = [
  { id: 'browser', label: 'Browser',  icon: '🌐' },
  { id: 'ai',      label: 'AI Agent', icon: '✨' },
  { id: 'tabs',    label: 'Tabs',     icon: '⬛' },
  { id: 'menu',    label: 'Menu',     icon: '☰'  },
];

export const AndroidNavBar: React.FC<Props> = ({ active, onTabPress, theme, tabCount, isAIActive }) => {
  const colors = uiColors(theme);

  const press = (id: NavTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabPress(id);
  };

  return (
    <View style={s.bar}>
      <LinearGradient colors={['transparent', BASE.bg]} style={s.topGrad} pointerEvents="none" />
      {TABS.map(tab => {
        const isActive = active === tab.id;
        const isAI     = tab.id === 'ai';
        return (
          <TouchableOpacity key={tab.id} style={s.item} onPress={() => press(tab.id)} hitSlop={A.hitSlop}>
            <View style={[s.iconWrap, isActive && { backgroundColor: colors.accentSoft }]}>
              {/* AI tab gets accent glow ring when active */}
              {isAI && isAIActive && <View style={[s.glowRing, { borderColor: colors.accentGlow }]} />}
              <Text style={[s.icon, { opacity: isActive ? 1 : 0.5 }]}>{tab.icon}</Text>
              {/* Tabs badge showing count */}
              {tab.id === 'tabs' && tabCount > 1 && (
                <View style={[s.badge, { backgroundColor: colors.accent }]}>
                  <Text style={s.badgeText}>{tabCount > 9 ? '9+' : tabCount}</Text>
                </View>
              )}
            </View>
            <Text style={[s.label, { color: isActive ? colors.accent : colors.textMuted }]}>{tab.label}</Text>
            {isActive && <View style={[s.dot, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  bar:     { height: A.navBarH, flexDirection: 'row', backgroundColor: BASE.panel, borderTopWidth: 1, borderTopColor: BASE.borderSubtle },
  topGrad: { position: 'absolute', top: -12, left: 0, right: 0, height: 12 },
  item:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  iconWrap:{ width: 40, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  icon:    { fontSize: 19, lineHeight: 22 },
  label:   { fontSize: 9.5, marginTop: 2, fontWeight: '500', letterSpacing: 0.3 },
  dot:     { position: 'absolute', bottom: 0, width: 20, height: 2.5, borderRadius: 2, top: -4 },
  glowRing:{ position: 'absolute', width: 38, height: 38, borderRadius: 19, borderWidth: 1.5 },
  badge:   { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '700' },
});
