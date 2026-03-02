// Feature: Layout | Why: Preview + haze + control panel + HeadlessWebView + VirtualCursor
import React, { Suspense, lazy } from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { BrowserPreview } from '../../components/BrowserPreview';
import { HeadlessWebView } from '../../features/browser/browser.headless-webview.component';
import { VirtualCursor } from '@features/browser';
import { RemoteMirrorPreview } from '@features/browser';
import { KeyboardCapture } from '@features/browser';
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
        {/* Outer wrapper: position:relative so VirtualCursor (absolute) escapes overflow:hidden */}
        <View style={{ flex: 1, minHeight: 400, position: 'relative' }}>
            <View
                style={[styles.webViewWrapper, { flex: 1 }]}
                {...responderProps}
            >
                {s.isRemoteMirrorEnabled
                    ? <RemoteMirrorPreview screenshot={s.remoteMirror?.screenshot || null} error={s.remoteMirror?.lastError || null} isConnected={!!s.remoteMirror?.isConnected} theme={theme} onPress={s.handleManualClick} onMouseMove={s.handleManualMouseMove} onScroll={s.handleManualScroll} />
                    : <BrowserPreview tabId={s.activeTabId} theme={theme} onPress={s.handleManualClick} onMouseMove={s.handleManualMouseMove} onScroll={s.handleManualScroll} />}
                {s.isAIMode && !s.isRemoteMirrorEnabled && (
                    <HeadlessWebView
                        ref={s.webViewRef}
                        isVisible={false}
                        url={s.webViewUrl || 'about:blank'}
                        useProxy={s.useProxy}
                        onDomMapReceived={s.handleDomMapReceived}
                        onNewTabRequested={s.addNewTab || (() => {})}
                    />
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
            {/* VirtualCursor lives OUTSIDE overflow:hidden webViewWrapper — not clipped */}
            {s.cursor && (
                <VirtualCursor cursor={s.cursor} accentColor={colors.accent} />
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
                    isRemoteMirrorEnabled={s.isRemoteMirrorEnabled}
                    onToggleRemoteMirror={() => s.setIsRemoteMirrorEnabled(!s.isRemoteMirrorEnabled)}
                    theme={theme}
                />
            </Suspense>
        )}
        {/* Forward keystrokes typed in the web-UI to the Playwright page's focused element */}
        <KeyboardCapture
            active={!!s.PROXY_BASE_URL}
            onType={s.handleManualType}
            onSpecialKey={s.handleManualKeyPress}
        />
    </>
    );
};
