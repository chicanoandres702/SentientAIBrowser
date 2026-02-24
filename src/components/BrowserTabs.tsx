import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { AppTheme } from '../../App';

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
    const accentColor = theme === 'red' ? '#ff003c' : '#00d2ff';

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

const styles = StyleSheet.create({
    container: {
        height: 48,
        backgroundColor: 'rgba(5, 5, 5, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        zIndex: 5,
    },
    scrollContent: {
        paddingHorizontal: 15,
        alignItems: 'flex-end',
    },
    tab: {
        height: 38,
        minWidth: 140,
        backgroundColor: 'rgba(20, 20, 20, 0.6)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        marginRight: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderBottomWidth: 0,
    },
    activeTab: {
        backgroundColor: 'rgba(15, 15, 15, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomWidth: 0,
        height: 42,
        ...Platform.select({
            web: { boxShadow: '0 -4px 15px rgba(0,0,0,0.5)' } as any,
            default: { elevation: 4 }
        }),
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    tabText: {
        color: '#666',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
    },
    closeBtn: {
        padding: 6,
        marginLeft: 10,
        opacity: 0.7,
    },
    closeIcon: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '300',
    },
    newTabBtn: {
        height: 38,
        width: 38,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center'
    },
    newTabIcon: {
        color: '#aaa',
        fontSize: 22,
        fontWeight: '300',
        marginTop: -3
    }
});
