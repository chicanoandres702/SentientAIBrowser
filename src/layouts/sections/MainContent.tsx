// Feature: Layout | Why: Routes layout modes to the correct content arrangement
import React from 'react';
import { Platform } from 'react-native';
import { uiColors } from '../../features/ui/theme/ui.theme';
import { LayoutMode } from '../../hooks/useBrowserState';
import { LayoutConfig } from '../config/layout.types';
import { DashboardLayout } from './DashboardLayout';
import { StackLayout } from './StackLayout';
import { RowLayout } from './RowLayout';

interface Props {
    s: any;
    theme: any;
    layoutMode: LayoutMode;
    config: LayoutConfig;
}

const NATIVE_RESPONDER = Object.freeze({
    onStartShouldSetResponder: () => false,
    onMoveShouldSetResponder: () => false,
    onResponderTerminationRequest: () => true,
});

/** Selects the correct layout arrangement based on mode + device */
export const MainContent: React.FC<Props> = ({ s, theme, layoutMode, config }) => {
    const responderProps = Platform.OS === 'web' ? {} : NATIVE_RESPONDER;
    const colors = uiColors(theme);
    const isDesktop = s.isDesktop;
    const showSidebar = config.showSidebar
        && (s.isSidebarVisible || config.sidebarPlacement === 'bottom');

    if (layoutMode === 'dashboard' && isDesktop) {
        return <DashboardLayout s={s} theme={theme} config={config}
            responderProps={responderProps} colors={colors} showSidebar={showSidebar} />;
    }

    if (config.contentDirection === 'column' || layoutMode === 'stack') {
        return <StackLayout s={s} theme={theme} config={config} layoutMode={layoutMode}
            responderProps={responderProps} colors={colors} isDesktop={isDesktop}
            showSidebar={showSidebar} />;
    }

    return <RowLayout s={s} theme={theme} config={config} layoutMode={layoutMode}
        responderProps={responderProps} colors={colors} isDesktop={isDesktop}
        showSidebar={showSidebar} />;
};
