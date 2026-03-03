// Feature: Android Layout | Trace: android-status-strip.component.tsx
/*
 * [Parent Feature/Milestone] Control Panel UI — Android Status Strip
 * [Child Task/Issue] Compact AI-state indicator docked below address bar
 * [Subtask] Shows LED + mode label + status message when AI is active
 * [Upstream] AndroidLayout → s.isAIMode, s.isPaused, s.statusMessage
 * [Downstream] Viewport (visual context for current AI state)
 * [Law Check] 48 lines | Passed 100-Line Law
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../../features/ui/theme/ui.theme';
import { BASE } from '../../../features/ui/theme/ui.primitives';

interface Props {
  isAIMode: boolean;
  isPaused: boolean;
  statusMessage: string;
  isScholarMode: boolean;
  theme: AppTheme;
}

export const AndroidStatusStrip: React.FC<Props> = ({
  isAIMode, isPaused, statusMessage, isScholarMode, theme,
}) => {
  if (!isAIMode) return null;
  const colors = uiColors(theme);
  const ledColor = isPaused ? BASE.warning : colors.accent;
  const modeLabel = isScholarMode ? 'SCHOLAR' : 'SENTIENT';
  const stateLabel = isPaused ? 'PAUSED' : 'LIVE';

  return (
    <View style={s.strip}>
      <View style={[s.led, { backgroundColor: ledColor, ...(({ boxShadow: `0 0 6px ${ledColor}` }) as any) }]} />
      <Text style={[s.modeTag, { color: ledColor }]}>{modeLabel}</Text>
      <Text style={s.sep}>·</Text>
      <Text style={[s.stateTag, { color: ledColor }]}>{stateLabel}</Text>
      <Text style={s.sep}>·</Text>
      <Text style={s.msg} numberOfLines={1}>{statusMessage || 'Ready'}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  strip: {
    height: 22, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 6,
    backgroundColor: BASE.panelGlass,
    borderBottomWidth: 1, borderBottomColor: BASE.borderSubtle,
  },
  led:      { width: 6, height: 6, borderRadius: 3 },
  modeTag:  { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  stateTag: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  sep:      { fontSize: 8, color: BASE.textFaint },
  msg:      { flex: 1, fontSize: 9, color: BASE.textMuted, fontWeight: '500' },
});
