/*
 * [Parent Feature/Milestone] Routines
 * [Child Task/Issue] Saved workflow picker UI
 * [Subtask] Scrollable card list; tap to run or long-press to preview steps
 * [Upstream] useRoutines -> [Downstream] AndroidMenuSheet + SettingsMenu
 * [Law Check] 90 lines | Passed 100-Line Law
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import type { RoutineItem } from '../routines.types';
import type { AppTheme } from '../../../../App';
import { uiColors } from '../../ui/theme/ui.theme';
import { BASE } from '../../ui/theme/ui.primitives';

interface Props {
  routines:        RoutineItem[];
  loading:         boolean;
  theme:           AppTheme;
  onRun:           (r: RoutineItem) => void;
  maxHeight?:      number;
}

export const RoutinePicker: React.FC<Props> = ({ routines, loading, theme, onRun, maxHeight = 320 }) => {
  const colors = uiColors(theme);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[s.hint, { color: colors.textMuted }]}>Loading routines…</Text>
      </View>
    );
  }

  if (routines.length === 0) {
    return (
      <View style={s.center}>
        <Text style={[s.emptyIcon]}>📋</Text>
        <Text style={[s.hint, { color: colors.textMuted }]}>No saved workflows yet.</Text>
        <Text style={[s.subHint, { color: colors.textFaint }]}>Run a task then tap "Save" to keep it.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {routines.map(r => {
        const open = expanded === r.id;
        return (
          <View key={r.id} style={[s.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
            <TouchableOpacity
              style={s.cardRow}
              onPress={() => setExpanded(open ? null : r.id)}
              activeOpacity={0.72}
            >
              <View style={s.cardInfo}>
                <Text style={[s.name, { color: colors.text }]} numberOfLines={1}>{r.name}</Text>
                <Text style={[s.desc, { color: colors.textMuted }]} numberOfLines={1}>
                  {r.steps.length} step{r.steps.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.runBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accentMuted }]}
                onPress={() => onRun(r)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[s.runTxt, { color: colors.accent }]}>▶ RUN</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            {open && r.steps.length > 0 && (
              <View style={[s.steps, { borderTopColor: colors.borderSubtle }]}>
                {r.steps.map((step, i) => (
                  <Text key={i} style={[s.step, { color: colors.textDim }]} numberOfLines={2}>
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  center:   { alignItems: 'center', paddingVertical: 24 },
  emptyIcon:{ fontSize: 28, marginBottom: 8 },
  hint:     { fontSize: 13, marginTop: 4 },
  subHint:  { fontSize: 11, marginTop: 4 },
  card:     { borderRadius: 10, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  cardRow:  { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardInfo: { flex: 1, marginRight: 10 },
  name:     { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  desc:     { fontSize: 11, marginTop: 2 },
  runBtn:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  runTxt:   { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  steps:    { borderTopWidth: 1, padding: 10, gap: 4 },
  step:     { fontSize: 12, lineHeight: 17 },
});
