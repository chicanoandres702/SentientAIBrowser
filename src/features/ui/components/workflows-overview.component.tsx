// Feature: UI | Source: WorkflowsOverview.tsx
// Task: Migrate WorkflowsOverview to feature module
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { AppTheme } from '../../../../App';
import { uiColors } from '@features/ui/theme/ui.theme';
import { overviewStyles as s } from './workflows-overview.styles';

interface Tab { id: string; title: string; isActive: boolean; url?: string; }

export interface Props {
    tabs: Tab[];
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab: () => void;
    theme: AppTheme;
}

const getDomain = (url?: string): string => {
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : 'new tab'; }
  catch { return url || 'new tab'; }
};

const getInitial = (title: string, url?: string): string => {
  try {
    if (url && url !== 'about:blank') return new URL(url).hostname.replace(/^www\./, '').charAt(0).toUpperCase();
  } catch {}
  return title.replace(/^New Tab$/i, '').charAt(0).toUpperCase() || '🌐';
};

export const WorkflowsOverview: React.FC<Props> = ({ tabs, onSelectTab, onCloseTab, onNewTab, theme }) => {
  const colors = uiColors(theme);
  const accent = colors.accent;

  return (
    <Animatable.View animation="slideInDown" duration={220} style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>ACTIVE WORKSPACE</Text>
        <Text style={[s.headerCount, { color: accent }]}>{tabs.length} OPEN</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.grid}>
        {tabs.filter(t => t.isActive).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.card, tab.isActive && s.activeCard, tab.isActive && { borderColor: accent + '50' }]}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.75}
          >
            {tab.isActive && <View style={[s.activePill, { backgroundColor: accent }]} />}
            <View style={[s.favicon, { backgroundColor: accent + (tab.isActive ? '25' : '10') }]}>
              <Text style={[s.faviconText, { color: tab.isActive ? accent : colors.textMuted }]}>
                {getInitial(tab.title, tab.url)}
              </Text>
            </View>
            <Text style={[s.cardTitle, tab.isActive && { color: colors.text }]} numberOfLines={1}>
              {tab.title || 'New Tab'}
            </Text>
            <Text style={s.cardUrl} numberOfLines={1}>{getDomain(tab.url)}</Text>
            <Text style={s.tabCount}>{tab.isActive ? '▶ ACTIVE' : 'BROWSER'}</Text>
            {tabs.length > 1 && (
              <TouchableOpacity style={s.closeBtn} onPress={() => onCloseTab(tab.id)}>
                <Text style={s.closeIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={s.newCard} onPress={onNewTab}>
          <Text style={[s.newIcon, { color: accent }]}>+</Text>
          <Text style={[s.newLabel, { color: accent + '99' }]}>NEW BROWSER</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animatable.View>
  );
};
