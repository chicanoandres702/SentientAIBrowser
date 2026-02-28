// Feature: UI | Why: Orchestrates the main app shell — delegates to section components
import React, { Suspense, lazy, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { BrowserTabs } from '../components/BrowserTabs';
import { BrowserChrome } from '../components/BrowserChrome';
import { styles } from '../../App.styles';
import { LayoutMode } from '../hooks/useBrowserState';
import { getLayoutConfig } from './config/layout.config';
import { MainContent } from './sections/MainContent';
import { MissionOverviewWrapper } from './sections/MissionOverviewWrapper';

const SentientHeader = lazy(() =>
    import('../components/SentientHeader').then(m => ({ default: m.SentientHeader })),
);
const SentientStatusBar = lazy(() =>
    import('../components/SentientStatusBar').then(m => ({ default: m.SentientStatusBar })),
);
const MainModals = lazy(() =>
    import('../components/MainModals').then(m => ({ default: m.MainModals })),
);

interface Props {
    s: any;
    theme: any;
    setTheme: (t: any) => void;
}

/** Top-level layout shell — header, tabs, chrome, content, status, modals */
export const MainLayout: React.FC<Props> = ({ s, theme, setTheme }) => {
    const [isMissionOverviewVisible, setIsMissionOverviewVisible] = useState(false);
    const layoutMode: LayoutMode = s.layoutMode || 'standard';
    const config = getLayoutConfig(layoutMode, s.isDesktop, s.isAIMode);

    return (
        <SafeAreaView style={styles.container}>
            <Suspense fallback={null}>
                <SentientHeader
                    isAIMode={s.isAIMode}
                    isSidebarVisible={s.isSidebarVisible}
                    setIsSidebarVisible={s.setIsSidebarVisible}
                    setIsSettingsVisible={s.setIsSettingsVisible}
                    setIsIntelVisible={s.setIsIntelVisible}
                    theme={theme}
                    layoutMode={layoutMode}
                    setLayoutMode={s.setLayoutMode}
                    isDesktop={s.isDesktop}
                />
            </Suspense>

            {config.showTabs && (
                <BrowserTabs
                    tabs={s.tabs}
                    onSelectTab={s.selectTab}
                    onCloseTab={s.closeTab}
                    onNewTab={() => s.addNewTab('https://www.google.com')}
                    theme={theme}
                />
            )}

            {config.showChrome && (
                <BrowserChrome
                    url={s.activeUrl}
                    onNavigate={s.navigateActiveTab || s.setActiveUrl}
                    onReload={s.handleReload}
                    theme={theme}
                />
            )}

            <MainContent s={s} theme={theme} layoutMode={layoutMode} config={config} />

            {config.showStatusBar && (
                <Suspense fallback={null}>
                    <SentientStatusBar
                        isAIMode={s.isAIMode}
                        statusMessage={s.statusMessage}
                        useProxy={s.useProxy}
                        theme={theme}
                        isScholarMode={s.isScholarMode}
                    />
                </Suspense>
            )}

            <Suspense fallback={null}>
                <MainModals s={s} theme={theme} setTheme={setTheme} />
            </Suspense>

            {isMissionOverviewVisible && (
                <MissionOverviewWrapper
                    s={s}
                    theme={theme}
                    onClose={() => setIsMissionOverviewVisible(false)}
                />
            )}
        </SafeAreaView>
    );
};
