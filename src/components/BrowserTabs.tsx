import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppTheme } from '../../App';

interface Tab {
    id: string;
    title: string;
    isActive: boolean;
}

interface Props {
    tabs: Tab[];
    onSelectTab: (id: string) => void;
    theme: AppTheme;
}

export const BrowserTabs: React.FC<Props> = ({ tabs, onSelectTab, theme }) => {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => onSelectTab(tab.id)}
                        style={[
                            styles.tab,
                            tab.isActive && styles.activeTab,
                            tab.isActive && {
                                borderBottomColor: theme === 'red' ? '#ff003c' : '#00d2ff',
                                shadowColor: theme === 'red' ? '#ff003c' : '#00d2ff',
                            }
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            tab.isActive && styles.activeTabText,
                            tab.isActive && { color: theme === 'red' ? '#ff406c' : '#40e0ff' }
                        ]}>
                            {tab.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 40,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    tab: {
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minWidth: 100,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#1a1a1a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    tabText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '500',
    },
    activeTabText: {
        fontWeight: 'bold',
    },
});
