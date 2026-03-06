// Feature: Settings | Trace: README.md
/*
 * [Parent Feature/Milestone] Settings
 * [Child Task/Issue] Settings menu modal component
 * [Subtask] Configuration UI for engine, appearance, and workspace
 * [Upstream] AppTheme + settings callbacks -> [Downstream] Settings modal
 * [Law Check] 87 lines | Passed 100-Line Law
 */

import React from 'react';
import { Text, View, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import type { AppTheme } from '../../../App';
import { SettingsEngineSection } from './SettingsEngineSection';
import { SettingsAppearanceSection } from './SettingsAppearanceSection';
import { SettingsLayoutSection } from './SettingsLayoutSection';
import { SettingsDaemonSection } from './SettingsDaemonSection';
import { SettingsLLMSection } from './SettingsLLMSection';
import { SettingsRoutinesSection } from './SettingsRoutinesSection';
import type { LayoutMode } from '../../hooks/useBrowserState';
import { uiColors } from '@features/ui/theme/ui.theme';
import { settingsMenuStyles as s } from '../../components/settings/SettingsMenu.styles';
import { RoutinePicker } from '../routines';
import type { RoutineItem } from '../routines';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isAIMode: boolean;
  setIsAIMode: (val: boolean) => void;
  useProxy: boolean;
  setUseProxy: (val: boolean) => void;
  isScholarMode: boolean;
  setIsScholarMode: (val: boolean) => void;
  isDaemonRunning: boolean;
  onToggleDaemon: () => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  runtimeGeminiApiKey: string;
  setRuntimeGeminiApiKey: (key: string) => void;
  useConfirmerAgent: boolean;
  setUseConfirmerAgent: (val: boolean) => void;
  routines?: RoutineItem[];
  routinesLoading?: boolean;
  onRunRoutine?: (r: RoutineItem) => void;
}

export const SettingsMenu: React.FC<Props> = (p) => {
  const colors = uiColors(p.theme);
  const accent = colors.accent;
  const scholarAccent = '#bf5af2';

  return (
    <Modal visible={p.visible} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={[s.sheet, { borderColor: colors.border, backgroundColor: colors.panel2 }]}>
          <View style={[s.handleBar, { backgroundColor: accent }]} />
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.title, { color: colors.text }]}>Configuration</Text>
              <Text style={[s.subtitle, { color: colors.textMuted }]}>Engine behavior, appearance & workspace layout</Text>
            </View>
            <TouchableOpacity style={[s.closeBtn, { borderColor: colors.border, backgroundColor: colors.bgElevated }]} onPress={p.onClose}>
              <Text style={[s.closeIcon, { color: colors.textDim }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            <SettingsEngineSection
              isAIMode={p.isAIMode} setIsAIMode={p.setIsAIMode}
              useProxy={p.useProxy} setUseProxy={p.setUseProxy}
              useConfirmerAgent={p.useConfirmerAgent} setUseConfirmerAgent={p.setUseConfirmerAgent}
              isScholarMode={p.isScholarMode} setIsScholarMode={p.setIsScholarMode}
              accent={accent} scholarAccent={scholarAccent} colors={colors}
            />
            <SettingsAppearanceSection theme={p.theme} setTheme={p.setTheme} colors={colors} />
            <SettingsLayoutSection layoutMode={p.layoutMode} setLayoutMode={p.setLayoutMode} accent={accent} colors={colors} />
            <SettingsDaemonSection isDaemonRunning={p.isDaemonRunning} onToggleDaemon={p.onToggleDaemon} accent={accent} colors={colors} />
            <SettingsLLMSection runtimeGeminiApiKey={p.runtimeGeminiApiKey} setRuntimeGeminiApiKey={p.setRuntimeGeminiApiKey} colors={colors} />
            <SettingsRoutinesSection routines={p.routines} routinesLoading={p.routinesLoading} onRunRoutine={p.onRunRoutine} theme={p.theme} colors={colors} />
          </ScrollView>
          <View style={[s.footer, { borderTopColor: colors.border }]}>
            <Text style={[s.version, { color: colors.textMuted }]}>SENTIENT BROWSER · v2.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

SettingsMenu.displayName = 'SettingsMenu';
