// Feature: Workflow | Trace: README.md
/*
 * [Parent Feature/Milestone] Workflow
 * [Child Task/Issue] Workflow selector component
 * [Subtask] Tab/workflow selector with domain display and add capability
 * [Upstream] Tab list + callbacks -> [Downstream] Workflow selector UI
 * [Law Check] 95 lines | Passed 100-Line Law
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { AppTheme } from '../../../App';
import { uiColors } from '@features/ui/theme/ui.theme';
import { getDomain, getInitial } from '@features/tab-management';
import { wss } from './workflow.selector.styles';

interface Tab {
  id: string;
  title: string;
  isActive: boolean;
  url?: string;
}

interface Props {
  tabs: Tab[];
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  theme: AppTheme;
}

export const WorkflowSelector: React.FC<Props> = ({ tabs, onSelectTab, onCloseTab, onNewTab, theme }) => {
  const colors = uiColors(theme);

  return (
    <View style={[wss.container, { borderBottomColor: colors.border }]}>
      <Text style={[wss.header, { color: colors.textDim }]}>WORKFLOW</Text>
      <ScrollView scrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={wss.workflowList}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[wss.workflowButton, tab.isActive && wss.workflowButtonActive, tab.isActive && { borderColor: colors.accent }]}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[wss.favicon, { backgroundColor: colors.accent + '15' }]}>
              <Text style={[wss.faviconText, { color: colors.accent }]}>{getInitial(tab.title, tab.url)}</Text>
            </View>
            <View style={wss.workflowInfo}>
              <Text style={[wss.workflowTitle, { color: tab.isActive ? colors.text : colors.textDim }]} numberOfLines={1}>
                {tab.title || 'New Tab'}
              </Text>
              <Text style={[wss.workflowUrl, { color: tab.isActive ? colors.textMuted : colors.textDim }]} numberOfLines={1}>
                {getDomain(tab.url)}
              </Text>
            </View>
            {tabs.length > 1 && (
              <TouchableOpacity style={wss.closeBtn} onPress={() => onCloseTab(tab.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={wss.closeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[wss.addButton, { borderColor: colors.border }]} onPress={onNewTab} activeOpacity={0.7}>
          <Text style={[wss.addButtonText, { color: colors.accent }]}>+ NEW WORKFLOW</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};


