// Feature: UI | Trace: src/components/WorkflowSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';
import { BASE } from '../features/ui/theme/ui.primitives';
import { getDomain, getInitial } from '../features/tab-management';

interface Tab { id: string; title: string; isActive: boolean; url?: string; }

interface Props {
  tabs: Tab[];
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  theme: AppTheme;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderSubtle,
  },
  header: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: BASE.textFaint,
    marginBottom: 8,
  },
  workflowList: { gap: 6 },
  workflowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BASE.borderMed,
    backgroundColor: BASE.inputBg,
  },
  workflowButtonActive: {
    backgroundColor: BASE.borderFocusStrong,
    borderColor: BASE.accent,
  },
  favicon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: BASE.bg },
  faviconText: { fontSize: 14, fontWeight: '700' },
  workflowInfo: { flex: 1 },
  workflowTitle: { fontSize: 11, fontWeight: '600', color: BASE.text },
  workflowUrl: { fontSize: 9, color: BASE.textMuted, marginTop: 2 },
  closeBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  closeBtnText: { fontSize: 14, color: BASE.textMuted, fontWeight: '300' },
  addButton: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: BASE.borderMed, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: BASE.textMuted },
});

export const WorkflowSelector: React.FC<Props> = ({ tabs, onSelectTab, onCloseTab, onNewTab, theme }) => {
  const colors = uiColors(theme);
  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.header, { color: colors.textFaint }]}>WORKFLOW</Text>
      <ScrollView scrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={styles.workflowList}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.workflowButton, tab.isActive && styles.workflowButtonActive, tab.isActive && { borderColor: colors.accent }]} onPress={() => onSelectTab(tab.id)} activeOpacity={0.7}>
            <View style={[styles.favicon, { backgroundColor: colors.accent + '15' }]}>
              <Text style={[styles.faviconText, { color: colors.accent }]}>{getInitial(tab.title, tab.url)}</Text>
            </View>
            <View style={styles.workflowInfo}>
              <Text style={[styles.workflowTitle, { color: tab.isActive ? colors.text : colors.textDim }]} numberOfLines={1}>
                {tab.title || 'New Tab'}
              </Text>
              <Text style={[styles.workflowUrl, { color: tab.isActive ? colors.textMuted : colors.textFaint }]} numberOfLines={1}>
                {getDomain(tab.url)}
              </Text>
            </View>
            {tabs.length > 1 && (
              <TouchableOpacity style={styles.closeBtn} onPress={() => onCloseTab(tab.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.addButton, { borderColor: colors.borderMed }]} onPress={onNewTab} activeOpacity={0.7}>
          <Text style={[styles.addButtonText, { color: colors.accent }]}>+ NEW WORKFLOW</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
