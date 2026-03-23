// Feature: Sidebar Intel Panel | Trace: src/layouts/sections/IntelPanel.tsx
// Why: Extracts mission intel panel logic from LayoutSidebar for modularity and Sentient compliance.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { sidebarStyles as ss } from '../styles/sidebar.styles';

export const IntelPanel: React.FC<{ s: any; theme: any }> = ({ s, theme }) => {
    const completedCount = s.tasks?.filter((t: any) => t.status === 'completed').length ?? 0;
    const pendingCount  = s.tasks?.filter((t: any) => t.status === 'pending').length ?? 0;
    const rows = [
        ['STATUS',      s.isAIMode ? (s.isPaused ? 'PAUSED' : 'LIVE') : 'IDLE'],
        ['MODE',        s.isScholarMode ? 'SCHOLAR' : s.isAIMode ? 'SENTIENT' : 'MANUAL'],
        ['ACTIVE TAB',  s.activeUrl ? new URL(s.activeUrl).hostname : '—'],
        ['TASKS DONE',  String(completedCount)],
        ['TASKS PENDING', String(pendingCount)],
        ['PROXY',       s.useProxy ? 'ON' : 'OFF'],
        ['TABS OPEN',   String(s.tabs?.length ?? 0)],
    ];
    return (
        <ScrollView style={ss.intelPanel}>
            <Text style={ss.intelTitle}>MISSION INTEL</Text>
            {(Array.isArray(rows) ? rows : []).map(([k, v]) => (
                <View key={k} style={ss.intelRow}>
                    <Text style={ss.intelKey}>{k}</Text>
                    <Text style={ss.intelVal}>{v}</Text>
                </View>
            ))}
        </ScrollView>
    );
};
