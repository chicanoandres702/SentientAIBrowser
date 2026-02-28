// Feature: Layout | Why: Stack/column arrangement isolated for single-responsibility
import React from 'react';
import { View } from 'react-native';
import { layoutSectionStyles as ls } from '../styles/layout-container.styles';
import { sidebarStyles as ss } from '../styles/sidebar.styles';
import { PreviewStage } from './PreviewStage';
import { MobileSidebar, SidebarContent } from './LayoutSidebar';
import { Monologue } from './Monologue';
import { UiColors } from '../../features/ui/theme/ui.theme';

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

/** Stack mode: vertical arrangement — preview top, sidebar bottom */
export const StackLayout: React.FC<Props> = ({
    s, theme, config, layoutMode, responderProps, colors, isDesktop, showSidebar,
}) => (
    <View style={ls.mainColumn}>
        <View style={[ls.contentAreaColumn, layoutMode === 'zen' && ls.zenContent]}>
            <PreviewStage s={s} theme={theme} responderProps={responderProps}
                hideControlPanel={!config.showControlPanel} />
        </View>
        {showSidebar && config.sidebarPlacement === 'bottom' && (
            <View style={[ss.bottomPanel, { borderTopColor: colors.border }]}>
                <SidebarContent s={s} theme={theme} />
            </View>
        )}
        {!isDesktop && s.isAIMode && s.isSidebarVisible
            && config.sidebarPlacement !== 'bottom' && (
            <MobileSidebar s={s} theme={theme} />
        )}
        <Monologue config={config} isAIMode={s.isAIMode} />
    </View>
);
