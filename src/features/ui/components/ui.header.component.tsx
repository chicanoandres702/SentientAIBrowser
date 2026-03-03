// Feature: UI | Source: SentientHeader.tsx — Command Bar redesign
/*
 * [Parent Feature/Milestone] Control Panel UI — Command Bar
 * [Child Task/Issue] Header redesign
 * [Subtask] Dense 3-zone command bar: brand | quick-actions | controls
 * [Upstream] useSentientBrowser → [Downstream] MainLayout
 * [Law Check] 90 lines | Passed 100-Line Law
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTheme } from '../../../../App';
import { Scanline } from '@features/browser';
import { uiColors } from '@features/ui/theme/ui.theme';
import { resolveDomainAccent } from '@features/ui/theme/domain-accent.utils';
import { LayoutSwitcherInline } from '../../../components/settings/LayoutSwitcher';
import { LayoutMode } from '../../../hooks/useBrowserState';
import { styles } from './ui.header.styles';
import { BASE } from '@features/ui/theme/ui.primitives';

export interface Props {
    isAIMode: boolean;
    isPaused?: boolean;
    isSidebarVisible: boolean;
    setIsSidebarVisible: (v: boolean) => void;
    setIsSettingsVisible: (v: boolean) => void;
    setIsIntelVisible: (v: boolean) => void;
    onToggleAI?: () => void;
    onNewTab?: () => void;
    onToggleMissions?: () => void;
    theme: AppTheme;
    domain?: string;
    layoutMode?: LayoutMode;
    setLayoutMode?: (mode: LayoutMode) => void;
    isDesktop?: boolean;
}

export const SentientHeader: React.FC<Props> = React.memo(
  ({
    isAIMode, isPaused = false, isSidebarVisible, setIsSidebarVisible,
    setIsSettingsVisible, setIsIntelVisible, onToggleAI, onNewTab, onToggleMissions,
    theme, domain, layoutMode = 'standard', setLayoutMode, isDesktop = true,
  }) => {
    const colors = uiColors(theme);
    const accent = resolveDomainAccent({ theme, domain });
    const ledColor = !isAIMode ? BASE.textFaint : isPaused ? BASE.warning : accent;
    const ledShadow = !isAIMode ? 'none' : `0 0 7px ${ledColor}`;

    return (
      <View style={styles.headerContainer}>
        <LinearGradient colors={[colors.panel, colors.panel2]} style={StyleSheet.absoluteFill} />
        {isAIMode && <Scanline color={accent} opacity={0.06} duration={5000} />}
        {/* Zone accent line — 3px top border in accent color */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: accent, opacity: 0.4 }} />
        <View style={styles.content}>
          {/* ── Zone 1: Brand ── */}
          <View style={styles.brand}>
            <View style={styles.orbStack}>
              <Animatable.View
                animation={isAIMode && !isPaused ? 'pulse' : undefined}
                iterationCount="infinite" duration={2400}
                style={[styles.brandOrbOuter, { backgroundColor: accent + '28', shadowColor: accent }]}
              />
              <View style={[styles.brandOrbInner, { backgroundColor: accent, shadowColor: accent }]} />
            </View>
            <Text style={[styles.brandText, { textShadowColor: accent }]}>
              {domain === 'capella.edu' ? 'SCHOLAR' : 'SENTIENT'}
            </Text>
          </View>

          {/* ── Zone 2: Command Centre ── */}
          <View style={styles.center}>
            {/* AI Toggle chip */}
            {onToggleAI && (
              <TouchableOpacity
                style={[styles.chip, isAIMode && { ...styles.chipActive, borderColor: `${accent}55`, backgroundColor: `${accent}12` }]}
                onPress={onToggleAI}
              >
                <View style={[styles.led, { backgroundColor: ledColor, ...(isAIMode ? { boxShadow: ledShadow } as any : {}) }]} />
                <Text style={[styles.chipText, isAIMode && { ...styles.chipTextActive, color: accent }]}>
                  {isAIMode ? (isPaused ? 'PAUSED' : 'LIVE') : 'AI OFF'}
                </Text>
              </TouchableOpacity>
            )}
            {/* Missions quick-access */}
            {onToggleMissions && (
              <TouchableOpacity style={styles.chip} onPress={onToggleMissions}>
                <Text style={styles.chipIcon}>📋</Text>
                <Text style={styles.chipText}>MISSIONS</Text>
              </TouchableOpacity>
            )}
            {/* New Tab chip */}
            {onNewTab && (
              <TouchableOpacity style={styles.chip} onPress={onNewTab}>
                <Text style={styles.chipIcon}>＋</Text>
                <Text style={styles.chipText}>TAB</Text>
              </TouchableOpacity>
            )}
            <View style={styles.zoneSep} />
            {/* Layout switcher inline */}
            {setLayoutMode && (
              <View style={styles.layoutCenter}>
                <LayoutSwitcherInline current={layoutMode} onSelect={setLayoutMode} accent={accent} isDesktop={isDesktop} />
              </View>
            )}
          </View>

          {/* ── Zone 3: Actions ── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.iconBtn, isSidebarVisible && { ...styles.iconBtnActive, backgroundColor: `${accent}14`, borderColor: `${accent}44` }]}
              onPress={() => setIsSidebarVisible(!isSidebarVisible)}
            >
              <Text style={[styles.iconText, { color: isSidebarVisible ? accent : colors.textMuted }]}>◈</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsIntelVisible(true)}>
              <Text style={styles.iconText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSettingsVisible(true)}>
              <Text style={styles.iconText}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);
