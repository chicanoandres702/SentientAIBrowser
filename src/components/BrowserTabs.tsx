// Feature: UI | Trace: README.md
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AppTheme } from '../../App';
import { uiColors } from '../features/ui/theme/ui.theme';

import { styles } from './BrowserTabs.styles';

interface Tab {
    id: string;
    title: string;
    isActive: boolean;
}

interface Props {
    tabs: Tab[];
    onSelectTab: (id: string) => void;
    onCloseTab: (id: string) => void;
    onNewTab: () => void;
    theme: AppTheme;
}

export const BrowserTabs: React.FC<Props> = React.memo(({ tabs, onSelectTab, onCloseTab, onNewTab, theme }) => {
    const colors = uiColors(theme);
    const accentColor = colors.accent;

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => onSelectTab(tab.id)}
                        style={[
                            styles.tab,
                            tab.isActive && styles.activeTab,
                        ]}
                    >
                        {tab.isActive && <View style={[styles.activeIndicator, { backgroundColor: accentColor }]} />}
                        <Text style={[
                            styles.tabText,
                            tab.isActive && { color: colors.text, fontWeight: '800' }
                        ]}>
                            {tab.title.toUpperCase()}
                        </Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => onCloseTab(tab.id)}>
                            <Text style={styles.closeIcon}>×</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.newTabBtn} onPress={onNewTab}>
                    <Text style={styles.newTabIcon}>+</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
});
