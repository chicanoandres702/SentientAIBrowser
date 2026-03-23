// Feature: UI | Trace: ui.header.component.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { LayoutSwitcherInline } from '../../../components/settings/LayoutSwitcher';
import { styles } from './ui.header.styles';
import { LayoutMode } from '../../../hooks/useBrowserState';

interface Props {
  isAIMode: boolean;
  isPaused: boolean;
  accent: string;
  onToggleAI?: () => void;
  onToggleMissions?: () => void;
  onNewTab?: () => void;
  layoutMode: LayoutMode;
  setLayoutMode?: (mode: LayoutMode) => void;
  isDesktop: boolean;
}

export const HeaderCommandCentre: React.FC<Props> = ({
  isAIMode,
  isPaused,
  accent,
  onToggleAI,
  onToggleMissions,
  onNewTab,
  layoutMode,
  setLayoutMode,
  isDesktop,
}) => {
  const ledColor = !isAIMode ? '#888' : isPaused ? '#f90' : accent;
  const ledShadow = !isAIMode ? 'none' : `0 0 7px ${ledColor}`;
  return (
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
  );
};
