// Feature: UI | Trace: README.md
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AppTheme } from '../../App';

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
    onOpenOverview?: () => void;
    theme: AppTheme;
}

export const BrowserTabs: React.FC<Props> = React.memo(({ tabs, onSelectTab, onCloseTab, onNewTab, onOpenOverview, theme }) => {
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {onOpenOverview && (
                    <TouchableOpacity style={[styles.tab, { backgroundColor: '#333' }]} onPress={onOpenOverview}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>⊞ MISSIONS</Text>
                    </TouchableOpacity>
                )}
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
                            tab.isActive && { color: '#fff', fontWeight: '900' }
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
