// Feature: Layout | Why: Mission overview wrapper keeps modal logic out of MainContent
import React, { Suspense, lazy } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { uiColors } from '../../features/ui/theme/ui.theme';

const MissionOverview = lazy(() =>
    import('../../features/missions/components/MissionOverview').then(m => ({ default: m.MissionOverview })),
);

interface Props {
    s: any;
    theme: any;
    onClose: () => void;
}

/** Full-screen overlay showing mission list / launcher */
export const MissionOverviewWrapper: React.FC<Props> = ({ s, theme, onClose }) => (
    <View style={StyleSheet.absoluteFill}>
        <Suspense fallback={<ActivityIndicator color={uiColors(theme).accent} />}>
            <MissionOverview
                theme={theme}
                onSelectMission={(id: any) => s.selectTab(id)}
                onLaunchRoutine={(url: any, goal: any) => {
                    (s.navigateActiveTab || s.setActiveUrl)(url);
                    s.handleExecutePrompt(goal);
                }}
                onClose={onClose}
                currentGoal={s.activePrompt}
                currentUrl={s.activeUrl}
            />
        </Suspense>
    </View>
);
