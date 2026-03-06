// Feature: Sidebar Tabs | Trace: src/layouts/sections/SidebarTabs.tsx
// Why: Extracts tab bar logic from LayoutSidebar for modularity and Sentient compliance.
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { sidebarStyles as ss } from '../styles/sidebar.styles';

const TABS = [
    { id: 'agent', icon: '🧠', label: 'AGENT' },
    { id: 'queue', icon: '📋', label: 'QUEUE' },
    { id: 'intel', icon: '📊', label: 'INTEL' },
];

export type DrawerTab = 'agent' | 'queue' | 'intel';

interface SidebarTabsProps {
    activeTab: DrawerTab;
    setActiveTab: (tab: DrawerTab) => void;
    accent: string;
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, setActiveTab, accent }) => (
    <View style={ss.tabBar}>
        {(Array.isArray(TABS) ? TABS : []).map(tab => {
            const isActive = activeTab === tab.id;
            return (
                <TouchableOpacity
                    key={tab.id}
                    style={[ss.tab, isActive && { ...ss.tabActive, borderBottomColor: accent }]}
                    onPress={() => setActiveTab(tab.id as DrawerTab)}
                >
                    <Text style={ss.tabIcon}>{tab.icon}</Text>
                    <Text style={[ss.tabLabel, isActive && { ...ss.tabLabelActive, color: accent }]}>{tab.label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);
