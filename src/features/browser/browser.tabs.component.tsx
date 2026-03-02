// Feature: UI | Why: Pill-shaped tab bar with favicon initials and workflow overview toggle
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AppTheme } from '../../../App';
import { uiColors } from '../ui/theme/ui.theme';
import { styles } from '../../components/BrowserTabs.styles';

interface Tab { id: string; title: string; isActive: boolean; url?: string; }

interface Props {
    tabs: Tab[];
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab: () => void;
    theme: AppTheme;
}

// Why: domain initial gives visual identity without loading remote favicon images
const getInitial = (title: string, url?: string): string => {
    try {
        if (url && url !== 'about:blank') return new URL(url).hostname.replace(/^www\./, '').charAt(0).toUpperCase();
    } catch {}
    return title.replace(/^New Tab$/i, '').charAt(0).toUpperCase() || '🌐';
};

export const BrowserTabs: React.FC<Props> = React.memo(({
    tabs, onSelectTab, onCloseTab, onNewTab, theme,
}) => {
    const accent = uiColors(theme).accent;
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Per-tab pill */}
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => onSelectTab(tab.id)}
                        style={[styles.tab, tab.isActive && styles.activeTab, tab.isActive && { borderColor: accent + '55' }]}
                    >
                        <View style={[styles.favicon, tab.isActive && { backgroundColor: accent + '22' }]}>
                            <Text style={[styles.faviconText, tab.isActive && { color: accent }]}>
                                {getInitial(tab.title, tab.url)}
                            </Text>
                        </View>
                        <Text
                            style={[styles.tabText, tab.isActive && styles.activeTabText, tab.isActive && { color: accent + 'dd' }]}
                            numberOfLines={1}
                        >
                            {tab.title || 'New Tab'}
                        </Text>
                        {tabs.length > 1 && (
                            <TouchableOpacity style={styles.closeBtn} onPress={() => onCloseTab(tab.id)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.newTabBtn} onPress={onNewTab}>
                    <Text style={styles.newTabIcon}>+</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
});
