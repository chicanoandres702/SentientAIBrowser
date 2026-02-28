// Feature: Layout | Why: Preview + haze + control panel + HeadlessWebView + VirtualCursor
import React, { Suspense, lazy } from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { BrowserPreview } from '../../components/BrowserPreview';
import { HeadlessWebView } from '../../components/HeadlessWebView';
import { VirtualCursor } from '../../components/VirtualCursor';
import { uiColors } from '../../features/ui/theme/ui.theme';
import { styles } from '../../../App.styles';

const HazeOverlay = lazy(() =>
    import('../../components/HazeOverlay').then(m => ({ default: m.HazeOverlay })),
);
const SentientControlPanel = lazy(() =>
    import('../../components/SentientControlPanel').then(m => ({ default: m.SentientControlPanel })),
);

interface Props {
    s: any;
    theme: any;
    responderProps: Record<string, unknown>;
    hideControlPanel?: boolean;
}

/** Renders the browser viewport, AI haze overlay, virtual cursor, and playback controls */
export const PreviewStage: React.FC<Props> = ({
    s,
    theme,
    responderProps,
    hideControlPanel = false,
}) => {
    const colors = uiColors(theme);
    return (
    <>
        <View
            style={[styles.webViewWrapper, { flex: 1, minHeight: 400 }]}
            {...responderProps}
        >
            <BrowserPreview tabId={s.activeTabId} theme={theme} />
            {s.isAIMode && (
                <HeadlessWebView
                    ref={s.webViewRef}
                    isVisible={false}
                    url={s.webViewUrl || 'about:blank'}
                    useProxy={s.useProxy}
                    onDomMapReceived={s.handleDomMapReceived}
                    onNewTabRequested={s.addNewTab || (() => {})}
                />
            )}
            {/* Virtual cursor overlay — shows AI clicking/typing in real-time */}
            {s.isAIMode && s.cursor && (
                <VirtualCursor cursor={s.cursor} accentColor={colors.accent} />
            )}
            {s.isAIMode && !s.isPaused && (
                <Animatable.View
                    animation="fadeIn"
                    iterationCount="infinite"
                    direction="alternate"
                    duration={3000}
                    style={[styles.hazeLayer, { pointerEvents: 'none' }]}
                >
                    <Suspense fallback={null}>
                        <HazeOverlay theme={theme} />
                    </Suspense>
                </Animatable.View>
            )}
        </View>

        {!hideControlPanel && s.isAIMode && (
            <Suspense fallback={null}>
                <SentientControlPanel
                    isPaused={s.isPaused}
                    onTogglePause={() => s.setIsPaused(!s.isPaused)}
                    onStop={() => {
                        s.setActivePrompt('');
                        s.setIsPaused(true);
                        s.setStatusMessage('Stopped');
                    }}
                    onNext={() => {}}
                    onPrev={() => {}}
                    theme={theme}
                />
            </Suspense>
        )}
    </>
    );
};
