// Feature: Layout | Why: Dashboard panel is a reusable card wrapper for dashboard mode
import React from 'react';
import { View, Text } from 'react-native';
import { dashboardStyles as ds } from '../styles/dashboard.styles';

interface Props {
    title: string;
    accent: string;
    children: React.ReactNode;
}

/** Titled panel card used inside the dashboard info bar */
export const DashboardPanel: React.FC<Props> = ({ title, accent, children }) => (
    <View style={ds.dashboardPanel}>
        <View style={ds.dashboardPanelHeader}>
            <View style={[ds.dashboardPanelDot, { backgroundColor: accent }]} />
            <Text style={[ds.dashboardPanelTitle, { color: accent }]}>
                {title}
            </Text>
        </View>
        <View style={ds.dashboardPanelBody}>{children}</View>
    </View>
);
