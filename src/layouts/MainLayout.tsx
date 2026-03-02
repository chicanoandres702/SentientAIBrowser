// Feature: UI | Why: Orchestrates the main app shell — delegates to section components
import React, { Suspense, lazy, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { BrowserTabs } from '../components/BrowserTabs';
import { BrowserChrome } from '../components/BrowserChrome';
import { WorkflowBar } from '../features/workflow/workflow.bar.component';
import { styles } from '../../App.styles';
import { LayoutMode } from '../hooks/useBrowserState';
import { getLayoutConfig } from './config/layout.config';
import { MainContent } from './sections/MainContent';
import { MissionOverviewWrapper } from './sections/MissionOverviewWrapper';

const SentientHeader = lazy(() =>
    import('@features/ui/components').then(m => ({ default: m.SentientHeader })),
);
const SentientStatusBar = lazy(() =>
    import('@features/ui/components').then(m => ({ default: m.SentientStatusBar })),
);
const MainModals = lazy(() =>
    import('../components/MainModals').then(m => ({ default: m.MainModals })),
);

interface Props {
    s: any;
    theme: any;
    setTheme: (t: any) => void;
}

/** Top-level layout shell — header, workflows overview (pinned), tabs, chrome, content */
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

            {/* Workflow bar — sits above the tab strip; each workflow groups multiple browser tabs */}
            <WorkflowBar
                workflows={s.workflows ?? []}
                onSelectWorkflow={s.selectWorkflow ?? (() => {})}
                onAddWorkflow={() => s.createWorkspaceTab?.()}
                onRemoveWorkflow={s.removeWorkflow ?? (() => {})}
                theme={theme}
            />

            {/* Tab pills — filtered to the active workflow's tab set */}
            {config.showTabs && (() => {
                const wfTabIds: string[] = s.workflows?.find((w: any) => w.isActive)?.tabIds ?? [];
                const visibleTabs = wfTabIds.length ? s.tabs.filter((t: any) => wfTabIds.includes(t.id)) : s.tabs;
                return <BrowserTabs tabs={visibleTabs} onSelectTab={s.selectTab} onCloseTab={s.closeTab} onNewTab={() => s.addNewTab('about:blank')} onCloseAll={s.closeWorkspace} cdpMode theme={theme} />;
            })()}

            {config.showChrome && <BrowserChrome url={s.activeUrl} onNavigate={s.navigateWithGuard || s.navigateActiveTab} onBack={s.navigateBack} onForward={s.navigateForward} onReload={s.handleReload} theme={theme} />}

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
