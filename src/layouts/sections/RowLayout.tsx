// Feature: Layout | Why: Row arrangement for standard/compact/focus/split/cockpit
import React from 'react';
import { View } from 'react-native';
import { layoutSectionStyles as ls } from '../styles/layout-container.styles';
import { PreviewStage } from './PreviewStage';
import { LayoutSidebar, MobileSidebar } from './LayoutSidebar';
import { Monologue } from './Monologue';
import { UiColors } from '../../features/ui/theme/ui.theme';
import { SidebarWidthMode } from '../config/layout.types';

interface Props {
    s: any;
    theme: any;
    config: any;
    layoutMode: string;
    responderProps: Record<string, unknown>;
    colors: UiColors;
    isDesktop: boolean;
    showSidebar: boolean;
}

/** Resolves sidebar width mode from the active layout mode */
const resolveWidthMode = (layoutMode: string): SidebarWidthMode => {
    const map: Record<string, SidebarWidthMode> = {
        compact: 'compact', focus: 'focus', split: 'split',
    };
    return map[layoutMode] ?? 'standard';
};

/** Row mode: horizontal — sidebar left or right of preview */
export const RowLayout: React.FC<Props> = ({
    s, theme, config, layoutMode, responderProps, colors, isDesktop, showSidebar,
}) => (
    <View style={ls.mainRow}>
        {showSidebar && config.sidebarPlacement === 'left' && (
            <LayoutSidebar s={s} theme={theme} placement="left"
                widthMode={layoutMode === 'cockpit' ? 'cockpit' : 'standard'}
                tintColor={colors.warning} />
        )}
        <View style={[
            ls.contentAreaRow,
            layoutMode === 'split' && ls.splitContent,
            layoutMode === 'zen' && ls.zenContent,
        ]}>
            <PreviewStage s={s} theme={theme} responderProps={responderProps}
                hideControlPanel={!config.showControlPanel} />
        </View>
        {showSidebar && config.sidebarPlacement === 'right' && (
            <LayoutSidebar s={s} theme={theme} placement="right"
                widthMode={resolveWidthMode(layoutMode)} tintColor={colors.accent} />
        )}
        {!isDesktop && s.isAIMode && s.isSidebarVisible && (
            <MobileSidebar s={s} theme={theme} />
        )}
        <Monologue config={config} isAIMode={s.isAIMode} />
    </View>
);
