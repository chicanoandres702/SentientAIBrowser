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
import { styles } from './ui.header.styles';
import { BASE } from '@features/ui/theme/ui.primitives';
import { HeaderBrand } from './HeaderBrand';
import { HeaderCommandCentre } from './HeaderCommandCentre';
import { HeaderActions } from './HeaderActions';

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
    return (
      <View style={styles.headerContainer}>
        <LinearGradient colors={[colors.panel, colors.panel2]} style={StyleSheet.absoluteFill} />
        {isAIMode && <Scanline color={accent} opacity={0.06} duration={5000} />}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: accent, opacity: 0.4 }} />
        <View style={styles.content}>
          <HeaderBrand accent={accent} domain={domain} isAIMode={isAIMode} isPaused={isPaused} />
          <HeaderCommandCentre
            isAIMode={isAIMode}
            isPaused={isPaused}
            accent={accent}
            onToggleAI={onToggleAI}
            onToggleMissions={onToggleMissions}
            onNewTab={onNewTab}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            isDesktop={isDesktop}
          />
          <HeaderActions
            isSidebarVisible={isSidebarVisible}
            setIsSidebarVisible={setIsSidebarVisible}
            setIsSettingsVisible={setIsSettingsVisible}
            setIsIntelVisible={setIsIntelVisible}
            accent={accent}
            colors={colors}
          />
        </View>
      </View>
    );
  }
);
