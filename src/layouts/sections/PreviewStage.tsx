// Feature: Layout | Why: Preview + haze + control panel isolated for single-responsibility
import React, { Suspense, lazy } from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { BrowserPreview } from '../../components/BrowserPreview';
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

/** Renders the browser viewport, AI haze overlay, and playback controls */
export const PreviewStage: React.FC<Props> = ({
    s,
    theme,
    responderProps,
    hideControlPanel = false,
}) => (
    <>
        <View
            style={[styles.webViewWrapper, { flex: 1, minHeight: 400 }]}
            {...responderProps}
        >
            <BrowserPreview tabId={s.activeTabId} theme={theme} />
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
                        s.setIsPaused(true);
                        s.handleExecutePrompt('');
                    }}
                    onNext={() => {}}
                    onPrev={() => {}}
                    theme={theme}
                />
            </Suspense>
        )}
    </>
);
