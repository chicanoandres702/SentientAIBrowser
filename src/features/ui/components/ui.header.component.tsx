// Feature: UI | Source: SentientHeader.tsx
// Task: Migrate SentientHeader to feature module
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

export interface Props {
    isAIMode: boolean;
    isSidebarVisible: boolean;
    setIsSidebarVisible: (v: boolean) => void;
    setIsSettingsVisible: (v: boolean) => void;
    setIsIntelVisible: (v: boolean) => void;
    theme: AppTheme;
    domain?: string;
    layoutMode?: LayoutMode;
    setLayoutMode?: (mode: LayoutMode) => void;
    isDesktop?: boolean;
}

export const SentientHeader: React.FC<Props> = React.memo(
  ({
    isAIMode, isSidebarVisible, setIsSidebarVisible, setIsSettingsVisible, setIsIntelVisible,
    theme, domain, layoutMode = 'standard', setLayoutMode, isDesktop = true,
  }) => {
    const colors = uiColors(theme);
    const accent = resolveDomainAccent({ theme, domain });

    return (
      <View style={styles.headerContainer}>
        <LinearGradient colors={[colors.panel, colors.panel2]} style={StyleSheet.absoluteFill} />
        {isAIMode && <Scanline color={accent} opacity={0.08} duration={5000} />}
        <View style={styles.content}>
          <View style={styles.brand}>
            <View style={styles.orbStack}>
              <Animatable.View
                animation={isAIMode ? 'pulse' : undefined}
                iterationCount="infinite"
                duration={2400}
                style={[styles.brandOrbOuter, { backgroundColor: accent + '28', shadowColor: accent }]}
              />
              <View style={[styles.brandOrbInner, { backgroundColor: accent, shadowColor: accent }]} />
            </View>
            <Text style={[styles.brandText, { textShadowColor: accent }]}>
              {domain === 'capella.edu' ? 'SCHOLAR' : 'SENTIENT'}
            </Text>
          </View>
          {setLayoutMode && (
            <View style={styles.center}>
              <LayoutSwitcherInline
                current={layoutMode}
                onSelect={setLayoutMode}
                accent={accent}
                isDesktop={isDesktop}
              />
            </View>
          )}
          <View style={styles.actions}>
            {isAIMode && (
              <TouchableOpacity
                style={[styles.iconBtn, isSidebarVisible && { backgroundColor: `${accent}14`, borderColor: `${accent}33` }]}
                onPress={() => setIsSidebarVisible(!isSidebarVisible)}
              >
                <Text style={[styles.iconText, { color: isSidebarVisible ? accent : colors.textMuted }]}>◈</Text>
              </TouchableOpacity>
            )}
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
