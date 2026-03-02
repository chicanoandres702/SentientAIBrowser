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
import { ConfigRow } from '../../components/settings/ConfigRow';
import { ThemeSelector } from '../../components/settings/ThemeSelector';
import { LayoutSelector } from '../../components/settings/LayoutSelector';
import type { LayoutMode } from '../../hooks/useBrowserState';
import { uiColors } from '@features/ui/theme/ui.theme';
import { settingsMenuStyles as s } from '../../components/settings/SettingsMenu.styles';

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
            <Text style={[s.section, { color: colors.textMuted }]}>CORE ENGINE</Text>
            <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
              <ConfigRow label="Sentient AI Mode" sub="Enable autonomous navigation" value={p.isAIMode} onToggle={p.setIsAIMode} accent={accent} />
              <ConfigRow label="CORS Proxy" sub="Bypass security restrictions" value={p.useProxy} onToggle={p.setUseProxy} accent={accent} />
              <ConfigRow label="Visual Confirmer" sub="Screenshot verify + auto-solve captcha" value={p.useConfirmerAgent} onToggle={p.setUseConfirmerAgent} accent={accent} />
              <ConfigRow label="Scholar Mode" sub="MISSION: SCHOLAR (Capella.edu)" value={p.isScholarMode} onToggle={p.setIsScholarMode} accent={scholarAccent} />
            </View>
            <Text style={[s.section, { color: colors.textMuted }]}>APPEARANCE</Text>
            <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
              <ThemeSelector current={p.theme} onSelect={p.setTheme} />
            </View>
            <Text style={[s.section, { color: colors.textMuted }]}>WORKSPACE LAYOUT</Text>
            <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
              <Text style={[s.layoutHint, { color: colors.textMuted }]}>Choose a layout optimized for your workflow. All layouts adapt to both desktop and mobile.</Text>
              <LayoutSelector current={p.layoutMode} onSelect={p.setLayoutMode} accent={accent} />
            </View>
            <Text style={[s.section, { color: colors.textMuted }]}>DAEMON</Text>
            <TouchableOpacity style={[s.daemonBtn, { borderColor: p.isDaemonRunning ? colors.danger + '44' : accent + '33', backgroundColor: p.isDaemonRunning ? colors.dangerSoft : `${accent}0a` }]} onPress={p.onToggleDaemon}>
              <View style={[s.daemonDot, { backgroundColor: p.isDaemonRunning ? colors.danger : accent }]} />
              <Text style={[s.daemonText, { color: p.isDaemonRunning ? colors.danger : accent }]}>{p.isDaemonRunning ? 'TERMINATE DAEMON' : 'LAUNCH DAEMON'}</Text>
            </TouchableOpacity>
            <Text style={[s.section, { color: colors.textMuted }]}>LLM OVERRIDE</Text>
            <View style={[s.sectionCard, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
              <Text style={[s.layoutHint, { color: colors.textMuted }]}>Optional runtime Gemini API key override (stored locally in this browser).</Text>
              <TextInput
                value={p.runtimeGeminiApiKey}
                onChangeText={p.setRuntimeGeminiApiKey}
                placeholder="AIza..."
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
                style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.panel2 }]}
              />
            </View>
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
