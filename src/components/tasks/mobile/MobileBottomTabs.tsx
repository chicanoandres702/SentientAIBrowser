// Feature: Tasks | Why: Bottom tab bar for mobile task views — page navigation
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { m } from './mobile-task.styles';
import { bottomTabStyles as s } from './MobileBottomTabs.styles';

export type MobileTaskPage = 'queue' | 'active' | 'stats' | 'prompt';

interface Props {
    activePage: MobileTaskPage;
    setActivePage: (p: MobileTaskPage) => void;
    accentColor: string;
    activeCount: number;
    completedCount: number;
}

const TABS: { page: MobileTaskPage; icon: string; label: string }[] = [
    { page: 'queue', icon: '📋', label: 'QUEUE' },
    { page: 'active', icon: '⚡', label: 'ACTIVE' },
    { page: 'stats', icon: '📊', label: 'STATS' },
    { page: 'prompt', icon: '💬', label: 'PROMPT' },
];

export const MobileBottomTabs: React.FC<Props> = ({
    activePage, setActivePage, accentColor, activeCount, completedCount,
}) => (
    <View style={[s.container, m.shadow]}>
        {TABS.map(tab => {
            const isActive = activePage === tab.page;
            const badge = tab.page === 'active' ? activeCount : tab.page === 'stats' ? completedCount : 0;
            return (
                <TouchableOpacity
                    key={tab.page}
                    style={[s.tab, isActive && { borderTopColor: accentColor }]}
                    onPress={() => setActivePage(tab.page)}
                    activeOpacity={0.6}
                >
                    <View style={s.iconWrap}>
                        <Text style={[s.icon, isActive && { transform: [{ scale: 1.15 }] }]}>{tab.icon}</Text>
                        {badge > 0 && (
                            <View style={[s.badge, { backgroundColor: accentColor }]}>
                                <Text style={s.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[s.label, isActive && { color: accentColor }]}>{tab.label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);
